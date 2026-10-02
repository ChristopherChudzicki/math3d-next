# screenshots

Dedicated Cloudflare Worker that renders a per-scene screenshot for each shared
math3d scene and caches it in R2. Its first consumer is the Open Graph card, but
the rendered PNG is a general primitive: My Scenes card thumbnails use it too,
and galleries may follow. It is **intentionally isolated and abandonable**: it
imports nothing from the rest of the monorepo (only `@cloudflare/puppeteer` and
its own relative modules), and nothing in the monorepo imports it. Its couplings
to the rest of the system are var-gated: the app Worker points `og:image` at the
GET, and the Django backend nudges the POST when a scene is saved and hands the
GET's URL to the app's My Scenes cards (`imageUrl`).

Design + rationale: `docs/superpowers/specs/2026-08-15-screenshot-cost-protection-design.md`
(ADR-0002), building on `docs/superpowers/specs/2026-08-08-og-per-scene-image-design.md`.

## What it does

The **backend is the sole gatekeeper** of the render path. This Worker never
decides on its own to spend a render: the GET only serves what is already
cached, and the POST renders only when the backend — which has already reserved
a slot against its per-period spend caps — tells it to.

`GET /screenshots/scene/{key}.png` (pure cache-serve, never renders):

1. R2 hit → serve the cached PNG (`Cache-Control: max-age=86400`).
2. Miss, invalid key, or a cache-read error → serve the branded default card
   (`max-age=60`). It does **not** render, schedule, or lock — a miss just means
   "no image yet".
3. With `?fallback=none`, step 2 returns `404` (`max-age=60`) instead of the
   default card. The app's scene-card thumbnails ask for this (Django's
   `imageUrl` carries it), so a missing render errors their `<img>` and leaves
   the card's own placeholder showing.
4. With `?v=` (the app's thumbnails send the scene's content version), a hit
   whose stored `version` differs gets `max-age=60` instead of a day: the
   save's render may still be in flight, and a day-long cache would pin the
   previous image to the new URL. A render with no stored `version` (made before
   versions existed) falls back to comparing its upload time with `v`.

Versions are what make that cache safe. Django bumps a scene's
`content_modified_date` only on the edits that trigger a render (items or item
order); a rename or archive leaves it, the URL, and the cached image alone.
`Scene.screenshot_version` is that date in canonical form. Django sends it with each `POST /render`, the render is stored
with it, and the thumbnail URL carries it as `v`, so "is this the render the URL
asks for" is an exact match. (Comparing upload time to a save time instead
would misjudge two quick saves, where the first save's render lands after the
second save, and would depend on two clocks agreeing.)

`POST /render` (secret-gated, backend-only):

1. `Authorization: Bearer <RENDER_SECRET>` mismatch/missing → `403` before any
   parsing or scheduling.
2. Body `{ "key": "<key>", "version": "<version>" }` with a key failing the
   key charset, or a `version` that is present but not 1–64 printable ASCII
   characters → `400`. `version` is optional, for backends that predate it.
3. Otherwise schedule a background render via `ctx.waitUntil` and return `202`
   immediately. The render screenshots `{FRAME_ORIGIN}/app/frame/{key}` at
   1200×630 (waiting for `data-scene-ready`) and writes the PNG to R2. It is
   bounded by `RENDER_DEADLINE_MS` (a timeout that closes the browser even on a
   hung page). The R2 object's custom metadata records `version`. All render
   failures are swallowed and logged — a failed render just leaves the default
   card in place until the next save re-nudges.

Renders are not single-flighted: two saves inside one render window launch two
concurrent renders of the same key, and the later-to-finish wins the R2 write —
so a slower render of an older save can leave a stale image in R2 (corrected on
the next save). It carries the older version, so thumbnails cache it for a minute
at a time rather than a day. Spend is still capped (each save consumed a
reservation), so this is a quality edge, not a cost one.

`GET /health` → `200 ok`.

### Who triggers a render

On `POST`/`PATCH` of a scene, the Django backend reserves a slot from its
daily+monthly Postgres ledgers (hard-bounding Browser Rendering spend) and, if
granted, best-effort nudges this Worker's `POST /render`. Over-cap saves simply
don't nudge — a coverage loss, never a spend risk. There is no crawler-driven
render path, so this Worker needs no per-key lock or scene-existence gate.

## Required infrastructure (not created by `wrangler deploy`)

`wrangler deploy` uploads the script and **binds** resources; it does not create
them. Before the Worker can render, provision on the Cloudflare account:

- **R2 bucket** `math3d-screenshots` (bound as `SCREENSHOTS_BUCKET`) — holds only
  the cached PNGs.
- **Browser Rendering** entitlement enabled (bound as `BROWSER`).
- **`RENDER_SECRET` Worker secret** (`wrangler secret put RENDER_SECRET`, or the
  dashboard) gating `POST /render`. It must equal the backend's `RENDER_SECRET`
  env var — point both at the value of an existing shared secret. It is a secret,
  not a plaintext `var`, so it is intentionally absent from `wrangler.jsonc`.
- **CI token scopes:** `CLOUDFLARE_API_TOKEN` needs Browser Rendering (edit) and
  R2 (edit) in addition to Workers Scripts, or the deploy/runtime fails.

`compatibility_flags: ["nodejs_compat"]` is required (`@cloudflare/puppeteer`
imports node builtins) and is set in `wrangler.jsonc`. Do not remove it — the
bundle uploads with only a warning but the Worker then 500s on every request.

## Enabling / disabling the feature (the dark switches)

Two independent var gates, both dark by default:

- **Serving:** the app Worker only points `og:image` at this Worker when
  `SCREENSHOTS_ORIGIN` is set. It comes from the `SCREENSHOTS_ORIGIN` GitHub
  Actions variable, injected into the app Worker at deploy time via `wrangler
deploy --var` (`deploy-reusable.yml`). Unset → the app serves its static
  default card.
- **Rendering and thumbnails:** the backend only nudges `POST /render` when its
  own `SCREENSHOTS_ORIGIN` env var is set, and only then returns a non-null
  `imageUrl` for My Scenes cards. Unset → saves behave exactly as before, nothing
  is ever rendered, and cards show their placeholder.

**Deploy order:** the Worker must be live (and its deploy green — the
`deploy-screenshots` job is non-blocking) before the backend's
`SCREENSHOTS_ORIGIN` is set, or before a backend change that relies on a newer
Worker ships. An older Worker ignores `?fallback=none` and `?v=`, so cards would
show the default card for unrendered scenes and could cache a superseded render
for a day. The reverse (new Worker, old backend) is safe: `version` is optional.

To enable end-to-end: deploy this Worker, set `RENDER_SECRET` on both sides,
smoke-test it, then set `SCREENSHOTS_ORIGIN` to its `*.workers.dev` host — as the
`SCREENSHOTS_ORIGIN` GitHub Actions variable (app Worker) and the backend env —
and redeploy.

CI deploys this Worker in its own `deploy-screenshots` job
(`.github/workflows/deploy-reusable.yml`), in parallel with and non-blocking to
the app deploy, so a failed/unprovisioned render deploy can never gate a release.

## Teardown (abandoning the experiment)

1. Clear the `SCREENSHOTS_ORIGIN` GitHub Actions variable and the backend env
   (if set) and redeploy — the app reverts to the static default card, the
   backend stops nudging, and My Scenes cards go back to their placeholder.
2. Delete the `deploy-screenshots` job from
   `.github/workflows/deploy-reusable.yml`.
3. `wrangler delete` the `math3d-screenshots` Worker and `wrangler secret delete
RENDER_SECRET`.
4. Delete the R2 bucket `math3d-screenshots`.
5. Narrow `CLOUDFLARE_API_TOKEN` back to Workers-only scopes.
6. Delete this package (`packages/screenshots`). Nothing else imports it, so no
   other code changes are needed. (The backend side is a separate teardown and
   is dark once step 1 is done: the `scenes.screenshots` reservation module —
   see ADR-0002 — and `MiniScene.imageUrl`, with its OpenAPI types and the
   SceneCard thumbnail. `Scene.content_modified_date` can stay; it means what
   its name says without the Worker.)

## Development

```bash
yarn workspace screenshots test        # vitest under @cloudflare/vitest-pool-workers
yarn workspace screenshots typecheck
cp .dev.vars.example .dev.vars          # once: FRAME_ORIGIN for local dev (gitignored)
yarn wrangler dev                       # from packages/screenshots (needs nodejs_compat)
```

Note: `vitest-pool-workers` resolves node builtins through Vite, so unit tests
pass even if `nodejs_compat` were missing — the flag can only be validated with
`wrangler dev`/`deploy`.
