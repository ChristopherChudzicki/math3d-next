# 0003 — Sentry monitoring (errors + traces)

**Status:** Accepted (2026-08-21)

## Context

Math3d has no error or performance monitoring across its four deployed
surfaces — the React SPA, the Django backend, the app Cloudflare Worker (serves
the SPA, injects OG metadata), and the screenshots Cloudflare Worker. A crash
in the SPA, a 500 in the API, or a failed render in a Worker is invisible
unless a user reports it or someone is tailing logs live at the moment it
happens.

The Sentry account is a Sponsored Business plan (5M errors, 1B spans per
month). At math3d's traffic that quota is not a constraint, so no sampling
design is needed.

## Decision

**Four Sentry projects, four DSNs** — one per surface, for separate issue
streams and alert rules.

**Production only.** Dev, CI, and tests leave the DSN unset, which is each
SDK's own disabled state. No `if (PROD)` branching.

**`tracesSampleRate` / `traces_sample_rate` = 1.0 everywhere.** The quota
supports it.

**No PII, no user identification.** `send_default_pii=False` (Python) /
`sendDefaultPii: false` (JS) set explicitly, not relied on as a default. No
`set_user` / `setUser` code on any surface.

**Source maps are uploaded to Sentry _and_ served publicly.** Math3d is open
source, and public maps make browser devtools match what Sentry shows.

**DSNs are deploy-injected, never committed.** The SPA's arrives as a
build-time `VITE_` var, Django's is a Heroku config var, and the Workers take
theirs via `wrangler deploy --var` — matching the existing convention for
`API_BASE` / `SITE_ORIGIN` / `FRAME_ORIGIN`. No DSN enters the repo.

**Two-phase rollout.** Phase 1 covers the SPA and Django — the surfaces
carrying the real bugs (math evaluation, scene loading, auth), and each
deploys independently of the Workers. Phase 2 covers the two Workers, as a
separate PR with its own `wrangler dev` validation and revert: a Worker that
uploads with only a warning can still fail to start and 500 every request,
including the app Worker fronting all navigations, so that change ships in
isolation.

## Consequences

- Traces are per-surface, not stitched across the frontend↔backend boundary.
  Stitching would require adding `sentry-trace` and `baggage` to
  `CORS_ALLOW_HEADERS`, turning today's simple GETs into preflighted ones —
  and the preflight cache is keyed on the full URL, not the route pattern, so
  every distinct scene key would cost an extra round trip on the first-render
  path. `traceparent` doesn't avoid this either: it isn't on the fixed
  CORS-safelisted header set, and whatwg/fetch#911 (the proposal to add it)
  is still open. Both surfaces still report their own errors and performance
  data; what's lost is a single linked frontend→backend waterfall.
- Anonymous traffic has no "users affected" count, since no user identity is
  attached to events.
- `send_default_pii=False` does not stop IP collection — Sentry's server
  infers the client IP from the connection regardless. Suppressing it is a
  per-project dashboard toggle ("Prevent Storing of IP Addresses"), left as an
  optional follow-up.
- Malformed `SENTRY_DSN` fails the same way any other bad config value does:
  `EnvConfig` validates it at boot, so a typo surfaces as
  `ImproperlyConfigured` rather than crashing gunicorn mid-request.

## Alternatives considered

- **A shared `@math3d/sentry` package:** three different SDKs (`@sentry/react`,
  `sentry-sdk[django]`, `@sentry/cloudflare`) across four risk profiles give a
  shared wrapper little to abstract. Rejected.
- **Stitch frontend and backend traces now:** the cost (an extra round trip
  before every new scene load) is paid on every request; the benefit (a
  linked waterfall) matters only once backend latency itself is the thing
  under investigation, which it isn't today — the backend is a thin CRUD API
  and most interesting latency is client-side. Deferred, not rejected.
- **Ship all four surfaces in one PR:** couples the two lower-risk surfaces to
  a Worker change that can take the whole site down if it fails to start.
  Rejected in favor of the two-phase split.
