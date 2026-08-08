# OG Sharing Metadata via Cloudflare Worker — Design

**Date:** 2026-07-11
**Status:** Approved design, pre-implementation
**Revised:** 2026-08-07 — split into two passes; reconciled with shipped work
(#1222 default image, #1223 static head + `VITE_SITE_ORIGIN`, #1209 render mode);
added the abandonability invariant; landed the `<title>` decision; moved KV +
API caching out of pass 1 into deferred levers.

## Problem

Math3d is a client-rendered SPA served from Cloudflare Workers Static Assets. Social
scrapers (Facebook, X/Twitter, Slack, Discord, LinkedIn) do not execute JavaScript, so a
shared scene link unfurls with whatever static `<head>` ships in `index.html`. As of #1223
that head carries sensible **site-level defaults** (title, description, branded default
`og:image`) — so every scene now unfurls with a real, branded card, but they all look
**identical**: none shows the specific scene's title.

We want per-scene Open Graph metadata (starting with the scene **title**) injected at the
edge, without server-side rendering the app.

## Already shipped (context)

The pieces this Worker builds on top of are already merged to `main`:

- **#1209 — render-mode route** (`/app/frame/:sceneKey` → `FramePage`). A headless,
  settle-detecting, single-frame scene render. It's the prerequisite/tool for pass 2
  (per-scene images), not needed by pass 1. Design:
  `docs/superpowers/specs/2026-07-12-scene-render-mode-decoupling-design.md`.
- **#1222 — static branded default `og:image`** (`packages/app/public/og/default.png`,
  1200×630) plus a committed generator pipeline under `packages/app-tests-e2e/src/og/`.
- **#1223 — static `<head>` OG/Twitter defaults + `VITE_SITE_ORIGIN`** (commit `d2ea6c0f`).
  `index.html` now ships the full default tag block (copy reused verbatim from live prod);
  `%VITE_SITE_ORIGIN%` is substituted at build time and wired through every Vite-running
  workflow (`test.yaml`, `e2e.yml`, `deploy-reusable.yml`) plus `.env.development`. It also
  reworked `useSceneLoader` to capture the shipped `document.title` on first render and
  restore it as the no-scene default (see "The `<title>` decision" — pass 1 changes how the
  loader sources that default).

So pass 1 is **purely the Worker**: the head defaults, the origin var, and the default
image already exist.

## The two passes

The remaining work splits into two independent PRs, deliberately kept separate so the
harder image pipeline can never gate the cheap text win:

- **Pass 1 — per-scene text** (this doc's main design). Worker rewrites `<title>` /
  `og:title` / `twitter:title` / `og:url` from the scene title. Ships with the existing
  static default image on every card.
- **Pass 2 — per-scene image** (see "Pass 2: per-scene images"). Adds `og:image` /
  `twitter:image` rewrites backed by a rendered-per-scene PNG. Separate PR, separate compute
  decision.

## Abandonability invariant (hard constraint)

**The SPA must remain fully functional with the entire edge layer removed.** If we drop the
Worker in a month and serve the built `./dist` from any dumb static host (backend still on
Django), everything works: the app boots, fetches scene data from the API exactly as it
does today, and link previews still unfurl — just with the static default image/title
instead of per-scene values. Graceful degradation, already true after #1223.

The rule that keeps it true: **the SPA may _opportunistically consume_ edge-provided data
purely as an optimization (hydrate-if-present, else fetch), but must never _depend_ on it.**
Concretely for pass 1, the Worker only writes crawler-facing `<head>` tags; the SPA gets its
data from Django and never reads anything the Worker injected as state. The one spot this
touches — `useSceneLoader`'s default-title source — is handled below by pointing it at a
Worker-_stable_ value, so the loader behaves identically whether or not the Worker ran.

## Goals (pass 1)

- A shared scene URL unfurls with that scene's **title** (`og:title` / `twitter:title`).
- A scene URL's **browser tab and `<title>` element** show the scene title at TTFB, before
  the app boots — and for non-JS crawlers/search.
- Home page and all non-scene routes keep the shipped site-level **defaults**.
- The branded **static default `og:image`** stays on every card (per-scene images are pass 2).
- Everything config-as-code, deployed by the existing `wrangler deploy` CI step.

## Non-goals (pass 1)

- Per-scene screenshot images (pass 2 — see "Pass 2: per-scene images").
- Per-scene `og:description` (the static site-tagline default covers every card — this
  default is load-bearing, see Tag set, and must not be dropped).
- Edge caching of any kind (KV title cache, CDN-cached scene GET). Pass 1 accepts a fetch
  per scene navigation. See "Deferred backend-load & perf levers" for why and when.
- Instant cache invalidation on scene edits (only relevant once a cache exists — deferred
  with KV).

## Canonical origin & the domain migration

The new app (this repo) is currently served at **`https://next.math3d.org`**. Apex
`math3d.org` presently 301-redirects to `www.math3d.org`, which is the **legacy** site — so the
canonical origin for the new app is `next.math3d.org` **for now**, not apex.

The intended end state is apex-as-canonical. The origin is consumed in two places — the static
`index.html` defaults (as `%VITE_SITE_ORIGIN%`, substituted at build time; shipped in #1223)
and the Worker's per-scene `og:url` (a `SITE_ORIGIN` `var` in `wrangler.jsonc`). **To avoid the
two drifting, source them from one value in CI**: `vite build` reads `VITE_SITE_ORIGIN`, and
`wrangler deploy --var SITE_ORIGIN:$SITE_ORIGIN` injects the same value. Both are
`https://next.math3d.org` now. (Do **not** bake apex into `og:url` yet: a scraper hitting
`math3d.org/<key>` today is redirected to the legacy site and would unfurl the wrong page.)

The apex cutover is **not** a one-line flip — two constraints:

- **`next.math3d.org` must keep resolving indefinitely** (ideally a path-preserving
  `301 → apex`). Shares already posted are cached under `next.math3d.org/<key>`; if `next` goes
  dark, those links 404 on click. A 301 also lets re-scrapes converge on the pinned apex `og:url`.
- **Engagement counts don't migrate.** FB/LinkedIn aggregate by `og:url`, so pre-flip shares
  (keyed to `next`) and post-flip shares (keyed to apex) are distinct identities — likes/shares
  won't merge. Acceptable, but know it before flipping.

## Key facts established during design

- **Scene URL shape:** `/:sceneKey?` at the root (`packages/app/src/routes.tsx`). A scene
  is a single path segment: `<origin>/<key>`. The only other routes are `/app/*` and a
  multi-segment catch-all — no other single-segment routes exist, so "single non-asset segment =
  candidate scene key" is sound.
- **Key charset:** generated keys use `KEY_ALPHABET` (alphanumeric, no `0OlI`-type ambiguities),
  length 10; the backend reserves only `app` and keys < 2 chars
  (`webserver/scenes/models.py`). Keys never contain `.` or `/`. Legacy scene keys also fit
  `[A-Za-z0-9_-]` (confirmed), so the Worker's validation regex covers them too.
- **Metadata source:** `GET /scenes/{key}/`, `auth=None` (public) — returns the full scene
  incl. `title` (`webserver/scenes/api.py`). Despite `by_alias=True`, `title` has **no alias**
  (verified in `webserver/openapi.v1.yaml`), so the Worker reads the JSON field `title`
  directly. Pass 1 reads `.title` off this full response (the double API call is accepted — see
  Non-goals; a lean `MiniSceneSchema` exists but is only wired to the list route, so there is no
  by-key title-only endpoint today). Production host: **`https://api.math3d.org`**.
- **Title default:** `title` is `TextField(blank=True, default="Untitled")`
  (`webserver/scenes/models.py`) — the API effectively always returns a non-empty title,
  often the literal `"Untitled"`.
- **Static Assets + Worker routing (IMPORTANT):** with our `compatibility_date` (≥ 2025-04-01),
  the `assets_navigation_prefers_asset_serving` flag is **on by default**. That means a
  **navigation request** (`Sec-Fetch-Mode: navigate` — every real browser, and any
  headless-browser-based scraper) to a path with no matching asset is served the SPA fallback
  `index.html` **without invoking the Worker**. So the Worker will **not** run for scene
  navigations unless we force it. **`run_worker_first` (a glob-pattern array) is required** — see
  Config. Requests that match a real static asset (`/assets/*`, `/og/*`, `/favicon.*`) should be
  excluded so they keep bypassing the Worker (zero invocations for assets).
- **Social caches** are URL-keyed; lifetimes vary (Facebook/LinkedIn effectively cache by URL
  for days-to-indefinite; Slack re-scrapes ~every 30 min; Discord is short). Facebook (and
  others) canonicalize on `og:url`, so pinning `og:url` to a fixed canonical consolidates
  cache/engagement identity — verified against FB docs ("Likes and Shares for this URL will
  aggregate at this URL").
- **No head-manager in the app:** `packages/app` has no react-helmet/unhead; the only runtime
  `<head>` write is `document.title` in `useSceneLoader`. So the Worker-injected meta tags are
  never clobbered or duplicated for real users, and the `<title>` element is the single tag the
  client and Worker both touch (reconciled by the decision below).

## Architecture (pass 1)

Convert `packages/app/wrangler.jsonc` from Static-Assets-only to Static-Assets + a Worker.
The Worker's sole job: for a scene-key navigation, look up the title and rewrite a small,
fixed set of `<meta>`/`<title>` elements in the SPA shell via `HTMLRewriter`. Everything else
passes through to `env.ASSETS` untouched.

### Tag set — defaults ship in `index.html`, per-scene values rewritten by the Worker

`packages/app/index.html` already ships the baked-in defaults (#1223), with
`%VITE_SITE_ORIGIN%` substituted at build time:

```html
<title>Math3d: Online 3d Graphing Calculator</title>
<meta
  name="description"
  content="An interactive 3D graphing calculator in your browser. Draw, animate, and share surfaces, curves, points, lines, and vectors."
/>
<meta property="og:site_name" content="Math3d" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Math3d: Online 3d Graphing Calculator" />
<meta
  property="og:description"
  content="An interactive 3D graphing calculator in your browser. Draw, animate, and share surfaces, curves, points, lines, and vectors."
/>
<meta property="og:url" content="%VITE_SITE_ORIGIN%/" />
<meta property="og:image" content="%VITE_SITE_ORIGIN%/og/default.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta
  property="og:image:alt"
  content="Math3d — interactive 3D graphing calculator"
/>
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Math3d: Online 3d Graphing Calculator" />
<meta name="twitter:image" content="%VITE_SITE_ORIGIN%/og/default.png" />
<meta
  name="twitter:image:alt"
  content="Math3d — interactive 3D graphing calculator"
/>
```

**Pass 1 adds one tag** to `index.html` — a Worker-stable copy of the default title for the
client to read (see the decision below):

```html
<meta name="default-title" content="Math3d: Online 3d Graphing Calculator" />
```

`default-title` holds the **identical** string to `<title>` in the shipped shell — the two are
the home/default view's title, co-located so a human editing one sees the other. The Worker
rewrites `<title>` per-scene but **never touches `default-title`**, so it remains the true
site default at runtime regardless of whether the Worker ran.

Notes (unchanged from #1223):

- **`og:image:width`/`height`/`type`** matter: without them the _first_ share of a URL (before
  any scraper has fetched+measured the PNG) can render blank/mis-cropped, fixed only on a later
  re-scrape. The default image is a known 1200×630 PNG, so these are free to state.
- **Keep the static `og:description`** — Discord/LinkedIn need a non-empty description to render
  an embed at all. Pass 1 doesn't vary it per scene; every card shares this text, which is fine.
- **No `twitter:site`/`twitter:creator`** — Math3d has no X handle. (X inherits `og:*` via its
  fallback chain, so `twitter:description` is unnecessary.)
- Home page and non-scene routes are covered by these defaults: the Worker either isn't invoked
  (a matched asset bypasses it) or runs and passes the request straight through (e.g. `/`, whose
  step-1 filter rejects the empty segment → `env.ASSETS.fetch` serves `index.html`).

On a scene page the Worker **overwrites the `content` attribute** of `og:title`,
`twitter:title`, and `og:url`, and rewrites the **`<title>` element** text. It leaves
`og:image*` / `og:site_name` / `og:description` / `default-title` at their defaults. (Pass 2
adds `og:image` / `twitter:image` rewrites.) HTMLRewriter mutates existing elements — no
duplicate tags.

### The `<title>` decision

**Chosen: the Worker rewrites the `<title>` element per-scene** (option b), because a
per-scene `<title>` sets the **browser tab** to the scene name at TTFB — before the heavy
MathBox app boots and the client would otherwise set it seconds later — and gives non-JS
crawlers/search the scene title too. `og:title`/`twitter:title` already drive the social card;
`<title>` adds the tab + SEO win.

The cost is the "strand bug": #1223's loader captures its no-scene default from
`document.title` via `useRef`, which on a scene-deep-link first load would capture the
Worker-written _scene_ title as if it were the site default. **Resolution — the loader sources
its default from the Worker-stable `<meta name="default-title">`** instead of `document.title`:

- `useSceneLoader` reads `meta[name="default-title"]`'s `content` (falling back to
  `document.title` for dev/tests where the meta may be absent) as its no-scene default, once,
  via the existing `useRef`.
- The Worker never rewrites `default-title`, so the loader gets the true site title whether or
  not the Worker ran — preserving the abandonability invariant.

This is a latent-landmine fix, not a live-bug fix: the strand path (navigating a loaded scene
back to no-scene while `MainPage` stays mounted) has **no UI affordance today** (verified: no
home/logo/new-scene control in `MainPage`'s `Header`). It's cheap to fix now and a future
"New scene" button would otherwise silently reintroduce stale tab titles.

Rejected alternatives: leaving `<title>` static (loses the tab/SEO win); hardcoding the default
title as a JS constant (works, but puts a second copy of the string in a different file — the
`default-title` meta keeps both copies co-located in `index.html`).

### Request flow (Worker `fetch` handler)

1. Parse `url.pathname`. **Passthrough** (`env.ASSETS.fetch(request)`, unchanged) unless the path
   is a single non-asset segment: reject `/app` or `/app/*`, empty/`/`, multi-segment (interior
   `/`), and dotted (contains `.`). Otherwise it's a **candidate scene key**.
2. **Validate the key** against `^[A-Za-z0-9_-]{2,80}$` (a superset of the real key charset). On
   failure → passthrough defaults with zero backend cost. (Cheap defense-in-depth: caps the
   junk-path amplification surface before any backend touch.)
3. `fetch(`${API_BASE}/scenes/${key}/`)` with `AbortSignal.timeout(~1000ms)`. The fetch uses a
   **bare URL string, not the incoming `request`** — no cookies/headers are forwarded (the
   endpoint is public `auth=None`; this also rules out any header-based cache-poisoning). On
   `200`, parse the body **defensively**: wrap `response.json()` and a
   `typeof body.title === "string"` check in the same try/catch as the failure paths.
   - Valid `200` → extract `title`, use it.
   - `404` / non-2xx / **malformed or missing-title 200** / timeout / network error →
     passthrough defaults. **The page must never block or error on the lookup.**
4. Fetch the SPA shell (`env.ASSETS.fetch`) and pipe it through `HTMLRewriter`, rewriting:
   `meta[property="og:title"]` / `meta[name="twitter:title"]` `content` (the title), the
   `<title>` element text, and `meta[property="og:url"]` `content` (= `${SITE_ORIGIN}/<key>`).
   Return the transformed response, setting an explicit **short/`private` `Cache-Control`** rather
   than inheriting `index.html`'s (so no intermediary over-caches per-scene HTML). HTMLRewriter
   preserves status/headers otherwise.

**Security notes (hard constraints):**

- The title is user-controlled — inject it **only** via HTMLRewriter's
  `element.setAttribute("content", …)` / `element.setInnerContent(…, {html:false})`, which
  HTML-escape the value. Never string-concatenate the title into raw HTML. A hostile-title unit
  test guards this.
- Keep `key`/`title` strictly **request-local** — no module-global mutable state in the Worker, or
  a concurrent request on the same isolate could cross-write.

### Title handling

- Trim the fetched title, then **clamp to ~200 chars** (`Scene.title` is an uncapped `TextField`;
  cards truncate ~60–90 anyway, and the clamp bounds the rewritten value). If empty or the literal
  `"Untitled"` → `"Untitled scene — Math3d"`. (A user who deliberately names a scene `"Untitled"`
  gets the generic card — acceptable.)
- `og:url` = `${SITE_ORIGIN}/<key>` (fixed canonical, regardless of the requested host).

### URL classification (why it's safe)

Malformed keys are rejected by the regex (step 2). Well-formed-but-nonexistent keys (e.g.
`/help`, `/about`, a deleted scene) 404 at the API → passthrough defaults. Reserved routes
(`/app/*`), asset-like, and multi-segment paths are filtered before any fetch. Every scene
navigation costs one Heroku fetch (no cache in pass 1); junk valid-charset single-segment paths
each cost one cheap Heroku 404 — bound abusive volume with a Cloudflare Rate-Limiting/WAF rule
on the scene route (see Launch prerequisites), which is the right place for it, not the cache.

## Config-as-code changes (pass 1)

`packages/app/wrangler.jsonc`:

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "math3d-next",
  "compatibility_date": "2026-07-04",
  "main": "./src/worker/index.ts",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    // Force the Worker to run for scene navigations; keep real assets bypassing it.
    // Exact globs to be validated with `wrangler dev` (multi-segment matching of `/*`).
    "run_worker_first": [
      "/*",
      "!/assets/*",
      "!/og/*",
      "!/favicon.ico",
      "!/favicon.svg",
      "!/apple-touch-icon.png",
      "!/index.html"
    ]
  },
  "vars": {
    "API_BASE": "https://api.math3d.org",
    // Committed default; overridden at deploy via `--var SITE_ORIGIN:$SITE_ORIGIN`, sourced from
    // the same CI value as VITE_SITE_ORIGIN (see Canonical origin & the domain migration).
    "SITE_ORIGIN": "https://next.math3d.org"
  }
}
```

(No `kv_namespaces` in pass 1 — KV is a deferred lever.)

New/changed files:

- `packages/app/src/worker/index.ts` — the Worker + `HTMLRewriter` handlers.
- `packages/app/src/worker/*.test.ts` — Worker unit tests (workers pool — see Testing).
- `packages/app/index.html` — add `<meta name="default-title">` (= `<title>`); the existing
  head-comment should note the Worker leaves `default-title` untouched.
- `packages/app/src/features/scene/useSceneLoader.ts` — source the no-scene default from
  `meta[name="default-title"]` instead of `document.title`.

No CI pipeline change: `deploy-reusable.yml` already runs `yarn wrangler deploy` after
`yarn build` produces `./dist`.

## Testing (pass 1)

Worker unit tests via `@cloudflare/vitest-pool-workers` (runs in workerd — `HTMLRewriter` doesn't
exist under jsdom).

**Config split (required).** `packages/app` currently has one Vitest config
(`vite.config.ts`, `environment: "jsdom"`, `include: ./src/**/*.{test,spec}.{ts,tsx}`) — which
_matches_ `src/worker/*.test.ts`. Introduce a Vitest **`projects`** split:

- **jsdom project** — the existing app tests. Move the current root `test` options
  (`globals`, `clearMocks`, `setupFiles: ["./src/setupTests.ts"]`, `env`, `css.modules`,
  `include`) _into_ this project, and add `exclude: ["./src/worker/**"]`.
- **workers project** — scoped to `src/worker/**`, using the **`cloudflareTest()` Vite plugin**
  from `@cloudflare/vitest-pool-workers` (options — e.g. `{ wrangler: { configPath: "./wrangler.jsonc" } }`
  — passed to the plugin). **Do not** load `setupTests.ts` here (it pulls in jsdom/Testing-Library
  globals absent under workerd, and the pool disallows a custom `environment`/`runner`).

Versions: `@cloudflare/vitest-pool-workers` **≥ 0.13** (the Vitest-4 line; the older
`defineWorkersProject`/`test.poolOptions.workers` API is **removed**) and **Vitest ≥ 4.1** (the app
pins `^4.0.18` — raise the floor). `yarn test`/Turbo run `vitest --run`, which executes both
projects in one invocation.

Test shell: worker tests run without a build, so `./dist` (the `ASSETS` directory) may be absent —
provide the HTML shell explicitly (a fixture string fed through `HTMLRewriter`, or a mocked
`env.ASSETS.fetch`) rather than relying on the real asset binding.

Worker cases:

- scene key, API `200` → `og:title`/`twitter:title`/`<title>`/`og:url` all rewritten correctly;
  `default-title` and `og:description` left untouched;
- empty / whitespace / `"Untitled"` title → `"Untitled scene — Math3d"` fallback;
- over-long title → clamped to ~200 chars;
- **hostile title** (`"><img src=x onerror=alert(1)>` and `&"<>`) → escaped, no attribute
  breakout (round-trips JSON-decode → HTML-escape);
- invalid key (bad charset, too long, `%2F`, CRLF) → passthrough, **no** Heroku touch;
- API `404` / timeout / 500 → shell served with default tags (no error);
- **malformed 200** (non-JSON body, or JSON missing a string `title`) → default tags;
- `/app/x`, multi-segment, dotted paths → passthrough, no fetch;
- no incoming request header/cookie is forwarded to the API fetch.

App-side case (jsdom project):

- `useSceneLoader` no-scene default reads `meta[name="default-title"]`: with the meta present
  (and a distinct `document.title`, simulating a Worker-rewritten `<title>`), leaving a loaded
  scene restores the meta value, not the scene title. (#1223's two title tests remain.)

Notes:

- `yarn start` (Vite dev) is unaffected — OG injection exists only in the built Worker; verify
  manually with `wrangler dev` against `./dist` (also the place to validate the `run_worker_first`
  globs).
- The Playwright e2e suite does not exercise the Worker.

## Deferred backend-load & perf levers (not in pass 1)

Pass 1 accepts one Heroku fetch per scene navigation (the Worker's) on top of the client's own
scene fetch — the "double API call." At current traffic each is a cheap indexed-key lookup, and
the app already does one such fetch per scene load. These levers exist for **if/when** origin
load or scene-page TTFB is measured to be a problem — none is built now (YAGNI), and each is
compatible with the abandonability invariant (all are optional optimizations the SPA doesn't
depend on):

### KV title cache (Worker-side)

Cache the title at the edge in **Cloudflare Workers KV** (`OG_CACHE`, key `title:<key>`) so
repeat scene navigations read the title in ~1ms instead of re-hitting Heroku, bounding Heroku
load to one fetch per scene per TTL window and cutting scene-page TTFB after the first load.
Design details (preserved from the original v1 sketch, for when this lands):

- **Positive-cache only — no negative sentinels.** KV's free tier allows only ~1,000 writes/day.
  Writing a sentinel per 404 would let junk/crawler traffic exhaust that budget. Write KV only on
  a `200` (`ctx.waitUntil(put(..., { expirationTtl }).catch(log))`); misses cost at most a fast
  Heroku 404. Trade-off: distinct valid-charset junk paths are each an uncacheable Heroku 404 —
  bound with the WAF rule, not the cache.
- **TTL** ~1 hour, tunable; keep it bounded (it's the self-healing backstop for the invalidation
  race below).
- Adds `kv_namespaces` to `wrangler.jsonc` and a one-time
  `yarn wrangler kv namespace create OG_CACHE` (+ `--preview`).
- **Cache invalidation (push, optional):** on scene `PATCH` (`webserver/scenes/api.py`), after
  saving, the Django handler best-effort **DELETEs** `title:<key>` via the KV REST API
  (`DELETE …/storage/kv/namespaces/{ns}/values/title:<key>`), strict ~1–2 s timeout, swallowing
  all errors (a save must never fail on a Cloudflare hiccup). DELETE (not overwrite) keeps the
  Worker the sole formatter of the value. **Token:** KV write tokens are account-scoped, not
  per-namespace — a single write-only secret that can write any KV namespace in the account.
  **Residual race:** a Worker miss that reads-then-`waitUntil`-writes can repopulate a stale
  title if a PATCH DELETE lands between; it self-heals at the TTL backstop, so keep TTL bounded.
  This same PATCH hook is where pass 2's image invalidation (`graphicsVersion` bump / re-render
  enqueue) would live — worth building once for both.

### CDN-cached scene GET

Put `Cache-Control` on the public `GET /scenes/{key}/` and let Cloudflare cache it (free on all
plans; no Cache Reserve). Offloads origin for **every** consumer (Worker, client, direct API
users), not just navigations. Prerequisites/costs: `api.math3d.org` must be **proxied** through
Cloudflare (orange-cloud), not DNS-only (unverified today); and invalidation (short TTL +
stale-while-revalidate, or CF purge on PATCH). More decoupled than the KV cache and survives
Worker removal, but carries the invalidation + proxying complexity — hence deferred.

### Narrow meta endpoint

Add `GET /scenes/{key}/meta/` returning just `{title}` (later `{title, description}`) so the
Worker depends on a tiny, stable shape instead of the full item schema (which churns). Cheap
(`MiniSceneSchema` already models it). Not "edge work" — a normal Django endpoint that survives
Worker removal. Contract-narrowing, not a load win on its own; fold in if/when we revisit the
Worker's fetch.

## Pass 2: per-scene images (separate PR)

Pass 1 ships the static default `og:image`. Per-scene screenshots of the MathBox scene are a
separate effort: the Worker additionally rewrites `og:image` / `twitter:image` to a
per-scene PNG.

**Fidelity spike — PASSED (2026-07-12).** The open question was whether GPU-less SwiftShader
(Cloudflare Browser Rendering's environment) renders MathBox scenes acceptably. Tested locally
by rendering a production scene (a translucent surface-of-revolution over a solid washer — the
stress case for software rendering) under forced SwiftShader
(`--use-angle=swiftshader --enable-unsafe-swiftshader`), confirming the active backend via
`UNMASKED_RENDERER_WEBGL` = `"ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device...), SwiftShader
driver)"` so it couldn't be a Mac-GPU false pass. Result: faithful — correct order-dependent
alpha blending on the translucent surface, correct solid shading/occlusion, crisp
anti-aliased axes/gridlines/labels, correct colors. Since Browser Rendering uses the same
ANGLE+SwiftShader path, the server-side image approach is viable with **no GPU infra**. (Spike
covered fidelity, not render-time/quota; a confirmation run on actual Browser Rendering is
cheap but not gating.)

Three viable compute paths, all storing the PNG blob in a bucket (R2 or S3) with only the URL

- a `graphicsVersion` in Postgres (never blobs in the DB):

1. **Cloudflare Browser Rendering + R2** — on-demand generate + cache, keyed by
   `sceneKey + graphicsVersion`. Runs on the current **Free** plan (Browser Rendering free
   tier: ~10 browser-min/day ≈ ~60 fresh renders/day; caching means only new/changed scenes
   cost anything). Zero runtime to own. Daily cap is the only constraint; $5/mo Workers Paid
   (10 browser-hr/mo ≈ ~3,600 renders) is the graceful upgrade.
2. **Self-hosted headless Chromium on the Heroku worker** (Celery/RQ/dramatiq + Playwright) —
   keeps data fully in-stack and reuses paid Heroku capacity; the durable cost is _owning the
   Chromium runtime_ (buildpack, ~300–700MB RAM/render, version upgrades). Same SwiftShader
   fidelity as option 1 (Heroku dynos have no GPU).
3. **Hybrid** — Heroku worker calls Cloudflare Browser Rendering's REST API, stores the PNG in
   your own S3 + Postgres URL. Your queue/triggers/storage, no Chromium runtime to own.

Client-side capture (screenshot in the sharer's browser) was **rejected**: nondeterministic
framing, attacker-controlled uploaded bytes served as public previews, can't regenerate on
graphics changes, and only covers scenes someone actually shares.

### App-side prerequisite — a deterministic render mode (shipped, #1209)

_Implemented in PR #1209 (the `/app/frame/:sceneKey` render page). Design:
`docs/superpowers/specs/2026-07-12-scene-render-mode-decoupling-design.md`. Summarized here
as-built; a few details diverged from the original sketch and are noted inline._

A headless screenshot of the app as-is has three problems — the first two confirmed by the
fidelity spike, the third about the screenshot-taker's resource use:

1. **Editor UI.** The controls sidebar/header/toolbar occupy the left third of the frame and
   shove the scene off-center — not a clean scene image. (The stats.js FPS overlay was in
   `mathboxOptions.plugins` too; it's now dropped from all scene rendering.)
2. **Animation.** Sliders can be auto-playing on load. Slider playback is a `useInterval` in the
   **sidebar** (`VariableSlider`) that advances the value into Redux — it is **not** part of the
   Three.js render loop, and there is **no** global clock/`t` parameter.
3. **Continuous rendering.** MathBox/Three.js runs a ~60 fps render loop. A static screenshot
   needs exactly one settled frame; the loop is otherwise pure wasted CPU on whatever takes the
   shot (a Browser Rendering session, a Heroku dyno). This was the main motivation.

As built, render mode is a **dedicated route** — `/app/frame/:sceneKey` → `FramePage`, rendering
`<Scene still>` full-viewport — **not** a query param on the scene URL (a route keeps the
frame-mode conditionals out of `MainPage`'s Header/Sidebar/banner tree; see the decoupling design
doc). It:

- **hides the editor UI** by **not mounting** `Header` / `Sidebar`+`SceneControls` /
  `ToggleKeyboardButton` — `FramePage` mounts only the scene. (The existing `?controls=0` param
  only **CSS-hides** the sidebar while leaving it mounted, so it does not stop slider timers and
  couldn't be reused for this.) The **blocking dependency** — scene _data-loading_ used to live
  inside `SceneControls`, so not-mounting it rendered a _blank_ scene — was removed by extracting
  a `useSceneLoader` hook that both the editor and the render page call;
- **stops the render loop** after the scene settles, via `mathbox.stop()` (→ `three.Loop.stop()`),
  and sets `data-scene-ready` on the container for a screenshotter to wait on;
- **freezes animation** for free by not mounting the sliders (removes the `useInterval`), which
  also freezes each variable at its stored value;
- does all of the above **without mutating persisted/Redux UI state**.

**"Settled" detection was the one hard part — and the original guess (a fixed frame count past
`warmup`) proved insufficient.** MathBox exposes no idle event, and mathbox-react built the scene
tree across more than one React commit, so its warmup queue (`getPending()`) was non-monotonic:
it could hit 0 _between_ commit bursts before the rest of the scene enqueued, so a fixed
frame-count settle risked a blank/half-drawn capture. Two fixes shipped — readiness gates on
**wall-clock queue quiescence** (`STILL_QUIET_MS`) rather than a frame count, and mathbox-react
was bumped to `1.0.1`, which creates nodes in a `useLayoutEffect` so the tree builds in one
synchronous commit burst (removing the transient at the source). A committed e2e regression test
(`frame-render.test.ts`) asserts the capture is content-present, not blank. A canonical default
camera framing for un-oriented scenes remains a possible follow-up.

**Worker-side item — not-found timeout.** The render page loads scenes with `onNotFound:
"silent"` (no dialog/redirect for a headless viewer), so a missing or deleted scene simply never
populates Redux and `data-scene-ready` **never fires**. The image-capture worker must therefore
apply a **short not-found timeout** (and ideally distinguish it — e.g. probe `GET /scenes/{key}/`
first, or cap the wait well under its full render budget) so a dead key doesn't cost a full
browser-hold per request. Do **not** raise the worker's readiness wait to cover this case.

**Social-cache implications for images:** updating an image later reaches only _future_ shares
and platforms that re-scrape soon (Slack ~30 min); already-posted links on FB/LinkedIn/X keep
the old image until they expire or are manually refreshed (FB Sharing Debugger / LinkedIn Post
Inspector; X has no reliable manual refresh). Version the image URL
(`/og/<key>-<graphicsVersion>.png`) so re-scrapes cache-bust cleanly — the only reliable
cross-platform bust. This tempers the "regenerate on graphics change" benefit — worth weighing
when picking the compute path.

## Launch prerequisites / open items

Pass 1:

- [ ] Add `<meta name="default-title">` to `index.html` and point `useSceneLoader`'s no-scene
      default at it.
- [ ] Validate the `run_worker_first` globs with `wrangler dev` (confirm `/*` matches
      single-segment scene keys and the asset exclusions bypass correctly; confirm
      `env.ASSETS.fetch` doesn't re-enter the Worker — one invocation per scene nav, no loop).
- [ ] Add a Cloudflare Rate-Limiting/WAF rule on the scene route to bound origin-404 abuse.
- [ ] Wire origin config from a single CI value (`VITE_SITE_ORIGIN` → build; same value →
      `wrangler deploy --var SITE_ORIGIN:$SITE_ORIGIN`). (`VITE_SITE_ORIGIN` already shipped
      in #1223; add the `SITE_ORIGIN` deploy `--var`.)

Cross-cutting / later:

- [ ] At apex cutover: flip the single CI origin value to apex, **and** keep `next.math3d.org`
      resolving (path-preserving `301 → apex`) so already-shared links survive (see Canonical
      origin & the domain migration).
- [ ] Pass 2: pick the image compute path; produce per-scene PNGs; add image rewrites + URL
      versioning (`/og/<key>-<graphicsVersion>.png`).
