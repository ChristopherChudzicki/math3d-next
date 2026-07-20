# OG Sharing Metadata via Cloudflare Worker — Design

**Date:** 2026-07-11
**Status:** Approved design, pre-implementation

## Problem

Math3d is a client-rendered SPA served from Cloudflare Workers Static Assets. Social
scrapers (Facebook, X/Twitter, Slack, Discord, LinkedIn) do not execute JavaScript, so a
shared scene link currently unfurls with whatever static `<head>` ships in `index.html` —
today that's a placeholder (`<title>Vite + React + TS</title>`, no OG tags at all). Every
shared scene looks identical and broken.

We want per-scene Open Graph metadata (starting with the scene **title**) injected at the
edge, without server-side rendering the app.

## Goals (v1)

- A shared scene URL unfurls with that scene's **title**.
- Home page and all non-scene routes unfurl with sensible **site-level defaults**.
- A single **static, branded default `og:image`** on every card (per-scene screenshots are
  a deferred fast-follow — see below).
- Everything config-as-code, deployed by the existing `wrangler deploy` CI step.

## Non-goals (v1)

- Per-scene screenshot images (deferred — see "Images: deferred fast-follow").
- Per-scene `og:description` (a static site-tagline default covers every card — this default
  is load-bearing, see Tag set, and must not be dropped).
- Instant cache invalidation on scene edits — v1 relies on TTL; edits are admin-only and rare,
  so ≤ TTL staleness is acceptable. A push-invalidation design is sketched for later.

## Canonical origin & the domain migration

The new app (this repo) is currently served at **`https://next.math3d.org`**. Apex
`math3d.org` presently 301-redirects to `www.math3d.org`, which is the **legacy** site — so the
canonical origin for the new app is `next.math3d.org` **for now**, not apex.

The intended end state is apex-as-canonical. The origin is consumed in two places — the static
`index.html` defaults (as `%VITE_SITE_ORIGIN%`, substituted at build time; Vite already does this
for `%VITE_APP_VERSION%`) and the Worker's per-scene `og:url` (a `SITE_ORIGIN` `var` in
`wrangler.jsonc`). **To avoid the two drifting, source them from one value in CI**: `vite build`
reads `VITE_SITE_ORIGIN`, and `wrangler deploy --var SITE_ORIGIN:$SITE_ORIGIN` injects the same
value. Both are `https://next.math3d.org` now. (Do **not** bake apex into `og:url` yet: a scraper
hitting `math3d.org/<key>` today is redirected to the legacy site and would unfurl the wrong page.)

The apex cutover is **not** a one-line flip — two constraints:

- **`next.math3d.org` must keep resolving indefinitely** (ideally a path-preserving
  `301 → apex`). Shares already posted are cached under `next.math3d.org/<key>`; if `next` goes
  dark, those links 404 on click. A 301 also lets re-scrapes converge on the pinned apex `og:url`.
- **Engagement counts don't migrate.** FB/LinkedIn aggregate by `og:url`, so pre-flip shares
  (keyed to `next`) and post-flip shares (keyed to apex) are distinct identities — likes/shares
  won't merge. Acceptable, but know it before flipping.

## Build sequencing

Decided 2026-07-12: build the **render-mode route first**, _before_ the metadata Worker.
Rationale — it's a self-contained app feature, it's the hard prerequisite for per-scene images,
and it doubles as the tool for authoring the static default `og:image` (screenshot a nice scene
in render mode rather than hand-designing a card). Order:

1. **Render-mode route** (app) — the "App-side prerequisite" section under Images below; gets its
   own plan. Built next.
2. **v1 metadata Worker** (the main design in this doc) — ships with the static default image,
   which step 1 helps produce.
3. **Per-scene image generation** (fast-follow) — pick a compute path; SwiftShader fidelity is
   already cleared (see Images below).

## Key facts established during design

- **Scene URL shape:** `/:sceneKey?` at the root (`packages/app/src/routes.tsx:39`). A scene
  is a single path segment: `<origin>/<key>`. The only other routes are `/app/*` and a
  multi-segment catch-all — no other single-segment routes exist, so "single non-asset segment =
  candidate scene key" is sound.
- **Key charset:** generated keys use `KEY_ALPHABET` (alphanumeric, no `0OlI`-type ambiguities),
  length 10; the backend reserves only `app` and keys < 2 chars
  (`webserver/scenes/models.py`). Keys never contain `.` or `/`. Legacy scene keys also fit
  `[A-Za-z0-9_-]` (confirmed), so the Worker's validation regex covers them too.
- **Metadata source:** `GET /scenes/{key}/`, `auth=None` (public) — returns the scene incl.
  `title` (`webserver/scenes/api.py:60`). Despite `by_alias=True`, `title` has **no alias**
  (verified in `webserver/openapi.v1.yaml`), so the Worker reads the JSON field `title`
  directly. Production host: **`https://api.math3d.org`**.
- **Title default:** `title` is `TextField(blank=True, default="Untitled")`
  (`webserver/scenes/models.py:108`) — the API effectively always returns a non-empty title,
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
  `<head>` write is `document.title` in `SceneControls`. So the Worker-injected meta tags are
  never clobbered or duplicated for real users. (Moot for scrapers, but confirms correctness.)

## Architecture

Convert `packages/app/wrangler.jsonc` from Static-Assets-only to Static-Assets + a Worker.
The Worker's sole job: for a scene-key navigation, look up the title and rewrite a small,
fixed set of `<meta>`/`<title>` elements in the SPA shell via `HTMLRewriter`. Everything else
passes through to `env.ASSETS` untouched.

### Tag set — defaults live in `index.html`, per-scene values rewritten by the Worker

`packages/app/index.html` ships baked-in defaults (also fixes the placeholder `<title>`).
`%VITE_SITE_ORIGIN%` is substituted at build time (`https://next.math3d.org` now):

```html
<title>Math3d — Interactive 3D Math Visualization</title>
<meta property="og:site_name" content="Math3d" />
<meta property="og:type" content="website" />
<meta
  property="og:title"
  content="Math3d — Interactive 3D Math Visualization"
/>
<meta property="og:description" content="Interactive 3D math visualization." />
<meta property="og:url" content="%VITE_SITE_ORIGIN%/" />
<meta property="og:image" content="%VITE_SITE_ORIGIN%/og/default.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Math3d — 3D math visualization" />
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:title"
  content="Math3d — Interactive 3D Math Visualization"
/>
<meta name="twitter:image" content="%VITE_SITE_ORIGIN%/og/default.png" />
<meta name="twitter:image:alt" content="Math3d — 3D math visualization" />
```

Notes:

- **`og:image:width`/`height`/`type`** matter: without them the _first_ share of a URL (before
  any scraper has fetched+measured the PNG) can render blank/mis-cropped, fixed only on a later
  re-scrape. The default image is a known 1200×630 PNG, so these are free to state.
- **Keep the static `og:description`** — Discord/LinkedIn need a non-empty description to render
  an embed at all. v1 doesn't vary it per scene; every card shares this text, which is fine.
- **No `twitter:site`/`twitter:creator`** — Math3d has no X handle. (X inherits `og:*` via its
  fallback chain, so `twitter:description` is unnecessary.)
- Home page and non-scene routes are covered by these defaults: the Worker either isn't invoked
  (a matched asset bypasses it) or runs and passes the request straight through (e.g. `/`, whose
  step-1 filter rejects the empty segment → `env.ASSETS.fetch` serves `index.html`).

The Worker, on a scene page, **overwrites the `content` attribute** of `og:title`,
`twitter:title`, and `og:url`, and rewrites the **`<title>` element** text. It leaves
`og:image*`/`og:site_name`/`og:description` at their defaults in v1. (The images fast-follow
adds `og:image`/`twitter:image` rewrites.) HTMLRewriter mutates existing elements — no
duplicate tags.

> The static default `og:image` asset (`/og/default.png`, 1200×630, branded) must be
> produced and committed to `packages/app/public/og/` before launch. **TODO: source/design
> this image** (the render-mode route is the intended tool for this) — a launch prerequisite,
> not a blocker for building the Worker.

### Request flow (Worker `fetch` handler)

1. Parse `url.pathname`. **Passthrough** (`env.ASSETS.fetch(request)`, unchanged) unless the path
   is a single non-asset segment: reject `/app` or `/app/*`, empty/`/`, multi-segment (interior
   `/`), and dotted (contains `.`). Otherwise it's a **candidate scene key**.
2. **Validate the key** against `^[A-Za-z0-9_-]{2,80}$` (a superset of the real key charset). On
   failure → passthrough defaults with **zero KV/Heroku cost**. (Cheap defense-in-depth: caps the
   junk-path amplification surface before any backend touch.)
3. Read the title from KV (`OG_CACHE`, key `title:<key>`):
   - **Hit** → use the cached title.
   - **Miss** → `fetch(`${API_BASE}/scenes/${key}/`)` with `AbortSignal.timeout(~1000ms)`. The
     fetch uses a **bare URL string, not the incoming `request`** — no cookies/headers are
     forwarded (the endpoint is public `auth=None`; this also rules out any header-based
     cache-poisoning). On `200`, parse the body **defensively**: wrap `response.json()` and a
     `typeof body.title === "string"` check in the same try/catch as the failure paths.
     - Valid `200` → extract `title`, write it to KV behind
       `ctx.waitUntil(put(...).catch(log))` with an `expirationTtl` (see Caching), and use it.
     - `404` / non-2xx / **malformed or missing-title 200** / timeout / network error →
       passthrough defaults, **no KV write** (see Caching rationale). **The page must never block
       or error on the lookup.**
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
  cards truncate ~60–90 anyway, and the clamp bounds the HTML/KV value). If empty or the literal
  `"Untitled"` → `"Untitled scene — Math3d"`. (A user who deliberately names a scene `"Untitled"`
  gets the generic card — acceptable.)
- `og:url` = `${SITE_ORIGIN}/<key>` (fixed canonical, regardless of the requested host).

### URL classification (why it's safe)

Malformed keys are rejected by the regex (step 2). Well-formed-but-nonexistent keys (e.g.
`/help`, `/about`, a deleted scene) 404 at the API → passthrough defaults. Reserved routes
(`/app/*`), asset-like, and multi-segment paths are filtered before any fetch. So the common
cases never touch KV or Heroku.

## Caching rationale

With `run_worker_first`, the Worker runs for **all** scene navigations (humans + scrapers), so
the KV cache keeps human scene-loads on a ~single-ms edge read instead of a synchronous Heroku
round-trip, and bounds Heroku load to one fetch per scene per TTL window.

**Positive-cache only — no negative sentinels.** KV's free tier allows only ~1,000 writes/day.
Writing a sentinel per 404 would let junk/crawler traffic exhaust that budget (a cheap
amplification). Instead we only write KV on a `200`, so misses cost at most a fast Heroku 404.

**The trade this makes — and its mitigation.** Positive-only means many _distinct_ junk
single-segment paths (`/aaaa`, `/aaab`, …) are each an uncacheable Heroku 404. The key-regex
rejects malformed junk, but valid-charset junk still reaches the origin — a new amplification
surface that didn't exist when Static Assets served every unmatched path at zero origin cost.
Heroku's 404 is a single indexed-key miss (cheap), so this is acceptable at our scale, but the
right place to bound abusive volume is **a Cloudflare Rate-Limiting/WAF rule on the scene route**,
not the cache. (Add such a rule — see Launch prerequisites.)

**TTL.** Since edits are admin-only and rare, a longer TTL is fine and cuts origin load; start
around **1 hour**, tunable. Keep it bounded even after push-invalidation ships — it's the backstop
that self-heals the read/write race noted in Cache invalidation, so don't raise it toward infinity.

## Cache invalidation (future — not in v1)

v1 accepts ≤ TTL title staleness. When instant edits are wanted, use **push invalidation from
the backend** (no polling, no separate infra):

- On scene `PATCH` (`webserver/scenes/api.py:78`), after saving, the Django handler **DELETEs**
  the key via the KV REST API (`DELETE …/storage/kv/namespaces/{ns}/values/title:<key>`). DELETE
  (not overwrite) keeps the **Worker the sole formatter** of the KV value — the backend needn't
  replicate the Worker's trim/`"Untitled"`-normalization; the next read repopulates from Heroku
  (one cheap re-fetch, negligible for rare admin edits).
- **Token:** Cloudflare KV write tokens are **account-scoped, not per-namespace** (the
  `Workers KV Storage Write` permission group is account-wide). So the Heroku token is a single
  account-scoped, write-only secret — acceptable, but it can write _any_ KV namespace in the
  account. Endpoint verified: `PUT/DELETE /accounts/{account_id}/storage/kv/namespaces/{ns}/values/{key}`,
  Bearer auth.
- **Call it best-effort, in-request, with a strict ~1–2 s timeout**, swallowing all
  errors/timeouts (there's no task queue — a save must never fail on a Cloudflare hiccup, and a
  _slow_ Cloudflare must not tie up the WSGI worker for long). Don't reuse this synchronous path
  for a high-volume write endpoint without revisiting.
- **Residual race (document, don't over-engineer):** a Worker KV miss reads the old title from
  Heroku and writes it via `ctx.waitUntil`; if a `PATCH` DELETE lands _between_ that read and the
  deferred write, the stale value is repopulated and persists until TTL. DELETE doesn't eliminate
  this. It self-heals at the TTL backstop — so **keep a bounded TTL (~1 h)** rather than raising it
  toward infinity while this race exists. A true fix (locks/timestamps) is overkill for admin-only
  rare edits.
- This same PATCH hook is where the **images fast-follow** bumps `graphicsVersion` / enqueues a
  re-render — so it's worth building once, for both.

## Config-as-code changes

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
  "kv_namespaces": [
    { "binding": "OG_CACHE", "id": "<prod-id>", "preview_id": "<preview-id>" }
  ],
  "vars": {
    "API_BASE": "https://api.math3d.org",
    // Committed default; overridden at deploy via `--var SITE_ORIGIN:$SITE_ORIGIN`, sourced from
    // the same CI value as VITE_SITE_ORIGIN (see Canonical origin & the domain migration).
    "SITE_ORIGIN": "https://next.math3d.org"
  }
}
```

One-time setup (documented in the plan, run once):

```bash
yarn wrangler kv namespace create OG_CACHE
yarn wrangler kv namespace create OG_CACHE --preview
```

New/changed files:

- `packages/app/src/worker/index.ts` — the Worker + `HTMLRewriter` handlers.
- `packages/app/src/worker/*.test.ts` — Worker unit tests (workers pool — see Testing).
- `packages/app/index.html` — real `<title>` + default OG/Twitter tags (with `%VITE_SITE_ORIGIN%`).
- `packages/app/public/og/default.png` — static branded default card (launch prerequisite).
- `.env.development` (+ build env) — add `VITE_SITE_ORIGIN`.

No CI pipeline change: `deploy-reusable.yml` already runs `yarn wrangler deploy` after
`yarn build` produces `./dist`.

## Testing

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

Cases:

- scene key, API `200` → `og:title`/`twitter:title`/`<title>`/`og:url` all rewritten correctly;
- empty / whitespace / `"Untitled"` title → `"Untitled scene — Math3d"` fallback;
- over-long title → clamped to ~200 chars;
- **hostile title** (`"><img src=x onerror=alert(1)>` and `&"<>`) → escaped, no attribute
  breakout (round-trips JSON-decode → HTML-escape);
- invalid key (bad charset, too long, `%2F`, CRLF) → passthrough, **no** KV/Heroku touch;
- API `404` / timeout / 500 → shell served with default tags (no error, no KV write);
- **malformed 200** (non-JSON body, or JSON missing a string `title`) → default tags, no KV write;
- `/app/x`, multi-segment, dotted paths → passthrough, no fetch;
- KV hit path → no Heroku fetch;
- no incoming request header/cookie is forwarded to the API fetch.

Notes:

- `yarn start` (Vite dev) is unaffected — OG injection exists only in the built Worker; verify
  manually with `wrangler dev` against `./dist` (also the place to validate the `run_worker_first`
  globs).
- The Playwright e2e suite does not exercise the Worker.

## Images: deferred fast-follow (not in v1)

v1 ships the static default `og:image`. Per-scene screenshots of the MathBox scene are a
separate effort.

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

### App-side prerequisite — a deterministic "render mode"

_(Being pulled forward — see Build sequencing: the next thing we build, ahead of the metadata
Worker, and the tool for authoring the static default `og:image`.)_

A headless screenshot of the app as-is has three problems — the first two confirmed by the
fidelity spike, the third about the screenshot-taker's resource use:

1. **UI chrome.** The controls sidebar/header/toolbar occupy the left third of the frame and
   shove the scene off-center — not a clean scene image. (Also the stats.js FPS overlay:
   `mathboxOptions.plugins` includes `"stats"` in `Scene.tsx:28`.)
2. **Animation.** Sliders can be auto-playing on load. Slider playback is a `useInterval` in the
   **sidebar** (`.../VariableSlider/index.tsx:116`) that advances the value into Redux — it is
   **not** part of the Three.js render loop, and there is **no** global clock/`t` parameter.
3. **Continuous rendering.** MathBox/Three.js runs a ~60 fps render loop. A static screenshot
   needs exactly one settled frame; the loop is otherwise pure wasted CPU on whatever takes the
   shot (a Browser Rendering session, a Heroku dyno). This is the main motivation.

The app needs a **render mode**, toggled by a query param (name TBD — need not contain "og";
candidates `?render` / `?screenshot` / `?still`), that:

- **hides all UI chrome** by **not mounting** `Header` / `Sidebar`+`SceneControls` /
  `ToggleKeyboardButton` (`MainPage.tsx:86–105`), and drops the stats overlay. Note the existing
  `?controls=0` param only **CSS-hides** the sidebar while leaving it mounted
  (`Sidebar.tsx:43,74`) — so it does **not** stop slider timers and can't be reused for this.
  **Blocking dependency:** scene _data-loading_ currently lives inside `SceneControls`
  (`useLoadSceneIntoRedux` — the sole `setScene` dispatcher), so not-mounting it would render a
  _blank_ scene. Decoupling that is a precursor refactor tracked separately —
  see `2026-07-12-scene-render-mode-decoupling-handoff.md`;
- **stops the render loop** after the scene settles. MathBox exposes `mathbox.stop()`/`start()`
  (→ `three.Loop.stop()`); `window.mathbox` is already wired (`Scene.tsx:37`), so it's a one-liner.
- **freezes animation** — achieved for free by not mounting the sliders (removes the `useInterval`),
  which also freezes each variable at its stored value;
- does all of the above **without mutating persisted/Redux UI state**.

Likely also wants a canonical default camera framing for scenes the author never re-oriented.
Feasibility read: **moderate, no blockers.** The one fuzzy piece is **"settled" detection** —
MathBox exposes no idle event, so render a fixed number of frames past `warmup` (or a short
timeout) then `stop()`; with sliders unmounted the scene is deterministic, so a fixed warmup is
likely sufficient.

**Social-cache implications for images:** updating an image later reaches only _future_ shares
and platforms that re-scrape soon (Slack ~30 min); already-posted links on FB/LinkedIn/X keep
the old image until they expire or are manually refreshed (FB Sharing Debugger / LinkedIn Post
Inspector; X has no reliable manual refresh). Version the image URL
(`/og/<key>-<graphicsVersion>.png`) so re-scrapes cache-bust cleanly — the only reliable
cross-platform bust. This tempers the "regenerate on graphics change" benefit — worth weighing
when picking the compute path.

## Launch prerequisites / open items

- [ ] Produce the static branded default `og:image` (1200×630) → `public/og/default.png`.
- [ ] At apex cutover: flip the single CI origin value to apex, **and** keep `next.math3d.org`
      resolving (path-preserving `301 → apex`) so already-shared links survive (see Canonical
      origin & the domain migration).
- [ ] Create the `OG_CACHE` KV namespace (prod + preview) and paste ids into `wrangler.jsonc`.
- [ ] Validate the `run_worker_first` globs with `wrangler dev` (confirm `/*` matches
      single-segment scene keys and the asset exclusions bypass correctly; confirm
      `env.ASSETS.fetch` doesn't re-enter the Worker — one invocation per scene nav, no loop).
- [ ] Add a Cloudflare Rate-Limiting/WAF rule on the scene route to bound origin-404 abuse
      (see Caching rationale).
- [ ] Wire origin config from a single CI value (`VITE_SITE_ORIGIN` → build; same value →
      `wrangler deploy --var SITE_ORIGIN:$SITE_ORIGIN`).
