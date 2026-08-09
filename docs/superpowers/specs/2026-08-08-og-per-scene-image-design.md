# Per-Scene OG Image (Pass 2) — Design

**Status:** Design / experiment. Not yet planned or implemented. Three-lens
review (cost/abuse, UX/product, technical+security) folded in.

**Goal:** Give each shared scene a per-scene social-card image (`og:image`)
rendered from the actual 3D scene, produced cheaply enough to run on Cloudflare's
free tier as an experiment.

**Architecture (one sentence):** A scene's `og:image` is rewritten by the edge
Worker to a per-scene image endpoint that serves a cached PNG from R2 when
present and otherwise serves the branded default while a background headless
render (Cloudflare Browser Rendering of the `/app/frame/:sceneKey` page from
#1209) populates the cache for next time.

**Tech stack:** Cloudflare Worker (existing `packages/app/src/worker/index.ts`),
Cloudflare Browser Rendering, Cloudflare R2, the `/app/frame/:sceneKey` headless
render page (#1209), django-ninja read-only `/scenes/{key}/meta/` (pass 1,
extended here to return a version marker).

---

## Global Constraints

- **Experiment on the free tier.** Free Browser Rendering = 10 minutes of
  browser time/day, 3 concurrent browsers, one new browser every 20s. Exceeding
  the daily quota returns `429 ... time limit exceeded for today` until the next
  UTC day — a **hard stop, never a charge.** This hard stop _is_ our cost cap for
  the experiment; no application-level budget is built in pass 2.
- **No surprise bills.** We do not move to Workers Paid as part of this work. If
  we ever do (which the roadmap does — see "Roadmap"), an application-level render
  budget becomes a **required prerequisite**, because on Paid, browser-time beyond
  the included allowance auto-bills at $0.09/browser-hour with no native hard
  spend cap.
- **The SPA must never depend on Worker- or render-injected data**
  (abandonability invariant, inherited from pass 1). Removing the edge/render
  layer degrades gracefully to the static default card.
- **Never block a user or crawler request on a render.** A render takes ~5–10s;
  crawlers time out in seconds. Every request returns immediately.
- **Scene key is untrusted.** Validate against the pass-1 `KEY_RE`
  (`/^[A-Za-z0-9_-]{2,80}$/`) before using it to build any URL.

---

## Background & Relationship to Pass 1

Pass 1 (merged, PR #1224, live in prod) put a Worker in front of the SPA's
static assets. On a single-segment scene-key navigation it fetches the title
from `GET /scenes/{key}/meta/` and rewrites `<title>`, `og:title`,
`twitter:title`, and `og:url` via `HTMLRewriter`. It **leaves `og:image` at the
static branded default** (`{SITE_ORIGIN}/og/default.png`, from PR #1223). Pass 2
is the "image" half.

`packages/app/index.html` already sets `og:image:width`/`height` (1200×630),
`og:image:type`, `twitter:card=summary_large_image`, and generic
`og:image:alt`/`twitter:image:alt`. Pass 2 therefore only needs to rewrite the
image URL (and, cheaply, the alt) — the dimensions/type/card tags are correct as
static defaults and are unchanged (the render targets the same 1200×630).

Pass 2 reuses two things built for exactly this:

- **`/app/frame/:sceneKey`** (#1209): a chrome-free, scene-only page that renders
  the 3D scene in `still` mode and sets `data-scene-ready="true"` on its
  container once MathBox's warmup queue drains (`Scene.tsx:184`). This is the
  screenshot-readiness signal.
- **`GET /scenes/{key}/meta/`** (pass 1): a side-effect-free read returning
  `{title}` for migrated `Scene` rows only. Extended here to `{title, version}`.

---

## Key Decision: Render on Request, Not on Create (v1)

**Decision:** In v1 the per-scene image is rendered **lazily, on the `og:image`
request**, and cached. We do **not** render on scene create or save.

**Rationale — creation is public, updates are private:**

- `POST /scenes/` is `auth=None` (api.py:46) — **anyone can create scenes without
  authenticating.** `PATCH /scenes/{key}/` requires session auth, and auth is not
  publicly enabled. So _creates_ are an open endpoint; _updates_ are a tiny
  trusted population.
- Rendering on create would render **every** created scene — including the many
  one-off experiments never shared — and, without a cost cap, would be an
  **unbounded, unauthenticated cost trigger**: a script looping `POST /scenes/`
  could drive browser-time at will. A per-key cooldown does not defend this (each
  spam create is a distinct key).
- Rendering on request scopes rendering to scenes that are actually unfurled;
  never-shared scenes cost zero renders, and each (scene, version) renders at
  most once thanks to caching + in-flight dedup.

**Honest scope of that protection (do not overstate it):** render-on-request
eliminates _accidental / zero-cost_ amplification, but it is **not**
attacker-proof. The `/og/scene/{key}.png` endpoint is directly, anonymously
hittable — an attacker can mint valid keys via public `POST /scenes/` and then
`GET` each image URL, and because the keys are distinct the per-key lock never
engages, so each schedules a render. The **only** real cap is the free-tier 429
hard stop. That caps _cost_ at $0 (we are never charged), but the daily render
budget (~60–120 renders) is trivially exhaustible, so **an anonymous caller can
DoS the feature for the rest of the UTC day** (legit scenes stop rendering;
already-cached images keep serving; new scenes show the default). We accept this
degradation for the free-tier experiment.

**v1 knowingly forfeits the first share.** Render-on-request as the sole trigger
_cannot_ improve the **first** unfurl: the render is triggered by the scrape and
takes 5–10s while the crawler is already fetching `og:image`, so the crawler gets
the default and the platform caches _those default bytes_ (often for days, keyed
by the URL, ignoring our `Cache-Control`). For the dominant path — build a scene,
paste the link into one Slack/Discord channel once — that single scrape is the
_only_ scrape, so the default is the **permanent** impression and pass 2 shows no
improvement over pass 1 for that share. v1's per-scene value therefore accrues to
scenes scraped by **multiple platforms or repeatedly over time**; the experiment
should be read as measuring that, honestly. Fixing first-share is deferred to the
roadmap (warm-on-create), which is gated on the cost cap anyway.

_(A warm-on-Share trigger was considered and rejected: `ShareButton` just calls
the same public create endpoint, so warming there only raises the bar from "API
calls" to "UI manipulation" — marginal — while adding client + endpoint
complexity to v1.)_

---

## Roadmap (post-v1, not built here)

Once v1 has produced render-wall-time and real usage data, the planned evolution
is **warm-on-create with overage protection**:

- **Add an application-level render budget** — an **atomic** counter reserved
  _before_ browser launch (a Durable Object counter or a DB `SELECT … FOR
UPDATE`, **not** KV, which is non-atomic/eventually-consistent and would let a
  concurrent burst overshoot). Ceiling set safely below a Cloudflare budget alert;
  a per-IP throttle so one caller can't burn the whole budget.
- **Then render on create/save.** The budget cap is precisely what makes
  create-render safe: it converts Cloudflare's auto-overage (charge more) into a
  hard stop (feature degrades), so rendering on the public create endpoint no
  longer implies unbounded cost. This delivers the first-share richness v1 gives
  up.

This is the reason render-on-create is "rejected for v1" rather than "rejected" —
it becomes correct once the cap exists.

---

## Request Flow

### 1. Worker rewrites `og:image` (+ alt) — extends pass-1 `rewriteShell`

On a scene-key navigation, in addition to the pass-1 rewrites, set:

```
og:image = twitter:image = {SITE_ORIGIN}/og/scene/{key}.png
og:image:alt = twitter:image:alt = <scene title>   (fallback to the generic
                                                     default alt for untitled)
```

The Worker already has the title in hand (pass-1 `fetchTitle`), so the per-scene
alt is nearly free and is the correct alt a screen-reader user hears for the
per-scene image. Values are Worker-constructed (same-origin URL) or the title set
via escaping-safe `setAttribute` — no user text is interpolated into markup.

### 2. Image endpoint: `GET /og/scene/{key}.png`

**Dispatch ordering (load-bearing):** this branch must be matched on `pathname`
**before** the pass-1 `sceneKeyFromPath`/`key === null` dispatch —
`sceneKeyFromPath` returns null for any path containing `/` or `.` (index.ts:28),
so `/og/scene/foo.png` would otherwise fall straight through to
`env.ASSETS.fetch`. The `fetch` handler also gains the `ctx: ExecutionContext`
parameter (currently `(request, env)`), required for `ctx.waitUntil`.

Logic:

1. Validate `key` against `KEY_RE`. Invalid → serve default PNG.
2. Look up `og/scene/{key}.png` in R2.
   - **Hit:** serve the cached PNG immediately with `Cache-Control: public,
max-age=86400`. **Do not call `/meta/` on the hot path** — staleness is
     re-checked at most once per short validation window (see Staleness), so a
     cache hit costs no origin round-trip.
   - **Miss:** serve the branded **default** PNG (short `Cache-Control: public,
max-age=60`) and `ctx.waitUntil(render(key))`.
3. Note: Worker-generated responses are **not** auto-cached at the CF edge, so the
   Worker runs on every request and would re-schedule a render each time during
   the render window — the in-flight lock (Stampede Control) is the sole thing
   preventing that, i.e. load-bearing, not an optimization.

### 3. Background render (`render(key)`)

Guarded by the in-flight lock. Steps:

1. Acquire the per-key render lock; if held, return.
2. **Resolve version first via `/meta/`.** If `/meta/` 404s (un-migrated legacy
   key) → **serve/keep default, do not render** (there is no version to store;
   `/app/frame/{key}` _would_ render a legacy key because `get_scene` migrates on
   GET, but we must not render without a version). If `/meta/` is non-2xx/times
   out → **fail open: treat as fresh, do not render** (reuse pass-1's
   `AbortSignal.timeout` + null-on-failure pattern). Only proceed on a 2xx with a
   version.
3. Launch a Browser Rendering session (respecting free-tier concurrency).
4. Navigate to `{SITE_ORIGIN}/app/frame/{key}` (key already validated).
5. Wait for `[data-scene-ready="true"]` with a timeout ceiling. On timeout, abort:
   release lock, leave the default/stale image, do not write R2.
6. Screenshot the viewport at 1200×630.
7. Write the PNG to R2 at `og/scene/{key}.png` with metadata `{version,
rendered_at}`.
8. Release the lock.

Any failure (429 quota, launch throttle, navigation error, timeout) is caught,
logged, swallowed — the previously-served result stands. No aggressive retry; the
next unfurl naturally retries.

---

## Storage (R2)

- A dedicated R2 bucket (e.g. `math3d-og-images`), bound to the Worker.
- Object key: `og/scene/{key}.png`. Metadata: `version`, `rendered_at`.
- R2 free tier (10 GB, generous operations) far exceeds this workload (~100 KB per
  shared scene).

---

## Staleness / Invalidation

Edits are rare and private; the user has explicitly rated edit-freshness
**non-critical**. Invalidation is best-effort, via a version check — not eager
purging:

- Extend `GET /scenes/{key}/meta/` to return `{title, version}`, where `version`
  is an **opaque token** = first 12 hex chars of
  `sha256(modified_date.isoformat())` (`TimestampedModel.save()` bumps
  `modified_date` on every save, models.py:90; hash the _stored_ value, not a
  re-read `now()`). Opaque so we don't leak edit times.
- Backend: use `Scene.objects.only("title", "modified_date")` — the current
  `.only("title")` (api.py:71) would lazy-load `modified_date` in a second query.
- **When staleness is checked:** _not_ on every hit (that would put an
  unauthenticated origin DB round-trip on every image request and defeat caching).
  Re-validate `version` only on a miss, and at most once per short validation
  window on hits (e.g. piggyback a `/meta/` check when the cached object is older
  than a threshold). A hit inside the window serves R2 with no origin call.
- **On a detected version mismatch, serve the existing (stale) per-scene image
  from R2 and background-re-render** — do **not** revert to the generic default.
  R2 already holds a good scene-specific image; showing the generic default until
  the re-render lands (and through the platform's multi-day scrape cache) would be
  a visible regression for zero benefit, and contradicts "edit-freshness
  non-critical." The default is reserved for a true miss, a legacy `/meta/` 404,
  or render failure.

**Known limitations:**

- Social platforms cache _their own_ scrape result (often days), keyed by the
  `og:image` URL, and largely ignore our `Cache-Control`. With a stable per-key
  URL, a platform that scraped an old image won't see an update until it
  re-scrapes. Given private, infrequent edits, acceptable for the experiment.
- **Title-fresh / image-stale mismatch:** pass-1 re-fetches the title live on
  every scrape (`fetchTitle`), so after an edit a re-scrape can show a fresh title
  next to a not-yet-updated image. Minor, noted for honesty.

**Alternative considered — versioned URL:** `og:image =
.../og/scene/{key}/{version}.png`. Because the injected HTML always carries the
current version, an edit changes the URL → a re-scrape fetches a fresh immutable
image → edit-invalidation becomes automatic. Rejected for v1 as URL-threading
complexity for a non-critical property. **It fixes edits only, not first-render**
— between the first scrape and the render completing, the version is unchanged, so
the URL is unchanged and the default is still sticky on first share.

---

## Stampede Control (in-flight dedup)

Free tier allows only 3 concurrent browsers and one new browser every 20s; a
popular scene can be unfurled by many crawlers at once. The lock is load-bearing
(see Request Flow step 3), not a nicety.

- **Use an R2 conditional-put marker as the lock, not KV.** KV is
  eventually-consistent across colos (propagation lag up to ~60s), so simultaneous
  Facebook/Twitter/LinkedIn crawlers hitting _different_ Cloudflare colos would
  each miss the lock and launch — colliding with the 3-concurrent / 1-per-20s
  limits and mostly failing. R2 conditional-put (`If-None-Match: *`) is a
  strongly-consistent atomic create and is the correct primitive; R2 is already a
  binding we add.
- **Lock TTL must exceed worst-case queued render time** (ready-wait ceiling +
  time queued behind the 1-per-20s throttle can exceed a naive 30s), or key the
  lock to render completion — otherwise the lock expires mid-render and a
  duplicate fires.
- **Distinct-key bursts:** the per-key lock does nothing for many _different_ keys
  missing at once (e.g. a scraper enumerating keys) — under free-tier limits those
  become a herd of launch-throttled failures. Add a cheap **global**
  concurrency/rate gate that no-ops the render trigger when already at the
  concurrency/rate ceiling (don't launch-and-fail). Failures are swallowed, but
  the gate prevents thrash during exactly the bursts we care about.
- **Robust upgrade (roadmap):** a Durable Object per key gives exact single-flight
  and enables an in-flight coalesce (render current, and if the version advanced
  during the render, one catch-up render). DOs require Workers Paid → out of scope
  for the free-tier experiment, folded into the roadmap's Paid move.

---

## Cost Model

**Free-tier experiment (this work):**

- Render cost is spent only on genuine unfurls, once per (scene, version).
- Free tier hard-stops at 10 browser-minutes/day (`429`). If we hit it — whether
  from real popularity or a deliberate DoS (see Key Decision) — per-scene images
  simply stop updating until the next UTC day; cached images keep serving; new
  scenes show the default. **This is the desired failure mode: the feature
  degrades, we are never charged.**
- Unknown to measure on the first real render: **render wall-time** (scene load +
  MathBox quiescence ≈ 500ms + screenshot). At ~5–10s/render, 10 min/day ≈ 60–120
  renders/day.

**Before going Paid (roadmap prerequisite, NOT built here):** see "Roadmap" — the
atomic reserve-before-launch budget + per-IP throttle + Cloudflare budget alert.
This is mandatory before either paying for Browser Rendering _or_ rendering on
create, because the image endpoint is anonymously hittable and Paid has no native
spend cap.

---

## Security

- **Key validation before URL construction** (SSRF/navigation safety): the render
  worker navigates a real browser to `{SITE_ORIGIN}/app/frame/{key}`; `key` is
  `KEY_RE`-validated and the origin is fixed from `SITE_ORIGIN` (never request
  input), so the target is always our own frame page with a charset-constrained
  key.
- **The render browser carries no credentials** (no cookies/headers forwarded to
  `/app/frame` or the API), so it renders only what an anonymous viewer could see.
  Anonymous scenes are immutable (`author=None`; `_require_owner` 403s everyone),
  so there is no version-busting-via-edit vector.
- **Amplification is _cost_-bounded but not _rate_-bounded on free tier:** the
  image endpoint is anonymously hittable and can exhaust the daily render budget
  (feature DoS, never a charge). Stated honestly rather than as "abuse-resistant."
  Rate-bounding is the roadmap's per-IP throttle.
- **HTMLRewriter injection safety** for the new image/alt tags: URL is
  Worker-constructed; alt is the title set via `setAttribute` (escaping-safe),
  matching pass-1's handling.

---

## UX Tradeoffs (explicit)

- **v1 does not improve the first (often only) share.** The render is triggered by
  the scrape and can't finish inside it; the platform caches the default,
  frequently permanently for one-and-done shares. v1's per-scene value accrues to
  scenes scraped by multiple platforms or repeatedly over time. First-share
  richness is a **roadmap** item (warm-on-create), consciously deferred to keep v1
  simple and gated on the cost cap.
- **Edited scenes can show a stale image** until re-scraped (Staleness) — low
  stakes (private, infrequent edits), and we serve the _stale per-scene_ image
  rather than the generic default.
- `max-age=60` on a miss is only a same-origin/CDN hint; it does **not** reliably
  drive a platform to re-scrape. The platform card-debugger "scrape again" flow is
  an **owner-only** manual workaround, not a general mitigation.
- **Degradation is graceful everywhere:** quota exhaustion, render failure, legacy
  key, or a missing scene all fall back to the default (or last-good) card.
  Nothing 500s, nothing blocks.

---

## Worker / Binding Architecture

- **Single Worker, path-routed** (simplest for the experiment): the existing
  `packages/app/src/worker/index.ts` gains (a) the `og:image`/alt rewrite in
  `rewriteShell` and (b) the `GET /og/scene/{key}.png` branch, dispatched
  **before** the pass-1 `key === null` line. New bindings: R2 bucket, Browser
  Rendering, and the R2 lock (same bucket or a markers prefix). `fetch` gains
  `ctx: ExecutionContext`.
- **Routing is the load-bearing unknown.** The current `run_worker_first` list has
  `!/og/*`. Making `/og/scene/*` reach the Worker while `/og/default.png` stays
  static requires a _positive_ `/og/scene/*` glob to override the earlier
  _negative_ `!/og/*`. Whether wrangler's `run_worker_first` honors
  positive-overrides-negative (and with what order/specificity rules) is **not**
  demonstrated by the current config, which only ever removes paths. **Validate
  with `wrangler dev` early**; if re-inclusion isn't supported, the fallback is a
  **dedicated render Worker on a `/og/scene/*` route.**
- **VERIFY AT IMPL:** confirm a single Worker can bind Static Assets **and**
  Browser Rendering (+ R2) simultaneously. If not — or to isolate the heavy
  browser binding and its failure profile from the latency-critical navigation
  path — split the image endpoint into the dedicated render Worker above.

---

## Dependencies & Sequencing

1. **FIRST — validate #1209 on real Cloudflare Browser Rendering.** Everything in
   #1209 was verified on macOS with forced SwiftShader, **never on real CF Browser
   Rendering.** Fastest path: the Browser Rendering **REST `/screenshot`
   endpoint** (no Worker deploy needed) pointed at the live
   `{SITE_ORIGIN}/app/frame/{key}`, with `waitForSelector:
'[data-scene-ready="true"]'` and `viewport: {width:1200,height:630}`. Confirms
   a non-blank render and yields the render-wall-time the cost model needs. (See
   "Validating #1209" appendix.)
2. Validate `run_worker_first` re-inclusion (or decide on the dedicated render
   Worker) with `wrangler dev`.
3. Extend `/scenes/{key}/meta/` → `{title, version}` (regen OpenAPI — the ninja
   docstring feeds the spec; CI diff-checks it).
4. Provision the R2 bucket (+ lock) and wire bindings.
5. Image endpoint (serve-or-render, serve-stale-on-mismatch, fail-open on meta)
   and the `og:image`/alt rewrite in the Worker.
6. `wrangler dev` glob/route validation.

---

## Out of Scope (pass 2 v1)

- Warm-on-create and the application-level render budget / per-IP throttle
  (roadmap — the budget is a prerequisite for both).
- Durable-Object single-flight and in-flight coalesce (Paid-gated; roadmap).
- Versioned `og:image` URLs (fix edits only; non-critical).
- Any change to the pass-1 title/og:url behavior.

---

## Testing Strategy

- **Worker unit (workerd, `vitest-pool-workers`):** `og:image`/alt rewrite present
  and correct; `/og/scene/{key}.png` serves cached bytes on an R2 hit **without a
  `/meta/` call**; serves default + schedules render on a miss; invalid key →
  default; **`/meta/` failure → treat-as-fresh, serve R2, no render**; **`/meta/`
  404 (legacy) → default, no render**; **version mismatch → serve stale R2 image +
  re-render (not default)**; render failure/timeout → previous result stands, no
  R2 write; in-flight lock prevents a second render _on one isolate_ (note: does
  **not** represent cross-colo contention — that's a design property, not
  unit-testable here). Browser Rendering and R2 mocked at the binding boundary.
- **Backend (pytest):** `/meta/` returns `version`; token changes iff
  `modified_date` changes; still no write side effects; `.only("title",
"modified_date")` issues one query.
- **Real-render validation (manual / CI-gated, mirrors #1209):** a guarded test
  that runs an actual Browser Rendering session against a seeded scene and asserts
  a content-present PNG (reuse the `colorfulPixelRatio` invariant).
- **E2E (`disable3d`):** pass-1 guarantees hold; the image route isn't exercised
  by the 3D-disabled suite.

---

## Open Questions (resolve at planning/impl)

- **Render wall-time** on real CF Browser Rendering (drives cost math + the
  readiness timeout ceiling).
- **Routing:** does `run_worker_first` re-include `/og/scene/*` over `!/og/*`, or
  do we need the dedicated render Worker?
- Can a **single Worker** bind Static Assets + Browser Rendering + R2, or split?
- **Screenshot capture rectangle / device scale** to match the default card's
  visual weight (default is generated at 2× then composed; live render may need
  tuning).

---

## Appendix: Validating #1209 on Real CF Browser Rendering

The frame page ships on `main` (`routes.tsx` → `frame/:sceneKey`), so it is live
at `{SITE_ORIGIN}/app/frame/{key}` in prod today — no deploy needed to test.

**Fastest check — REST `/screenshot`** (needs an API token with _Browser
Rendering – Edit_ and the account ID; both already exist as CI credentials):

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/browser-rendering/screenshot
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "url": "https://next.math3d.org/app/frame/{REAL_KEY}",
  "viewport": { "width": 1200, "height": 630 },
  "waitForSelector": "[data-scene-ready=\"true\"]",
  "gotoOptions": { "waitUntil": "networkidle0" }
}
```

Save the PNG body and eyeball it (non-blank, correct scene). Time it with `curl -w
'%{time_total}'` over a few runs against a content-rich scene → that end-to-end
latency ≈ render wall-time for the cost model. REST usage counts against the same
free-tier daily quota (a handful of test renders is negligible). Confirm the exact
`waitForSelector` value shape (string vs `{selector, timeout}`) against current
docs when running.

**Faithful check (second step) — Workers Binding:** a throwaway Worker with a
`browser` binding + `@cloudflare/puppeteer`: `page.goto(frameURL, {waitUntil})`,
`page.waitForSelector('[data-scene-ready="true"]')`, `page.screenshot()`. This is
the exact primitive the production render path uses; do it once the REST check
looks good, to catch any binding-only differences before building the endpoint.
