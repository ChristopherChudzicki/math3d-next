# screenshots

Dedicated Cloudflare Worker that renders a per-scene screenshot for each shared
math3d scene and caches it in R2. Its first consumer is the Open Graph card, but
the rendered PNG is a general primitive (thumbnails, galleries follow). It is
**intentionally isolated and abandonable**: it imports nothing from the rest of
the monorepo (only `@cloudflare/puppeteer` and its own relative modules), and
nothing in the monorepo imports it. Its couplings to the rest of the system are
two var-gated blocks: the app Worker points `og:image` at the GET, and the
Django backend nudges the POST when a scene is saved.

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

`POST /render` (secret-gated, backend-only):

1. `Authorization: Bearer <RENDER_SECRET>` mismatch/missing → `403` before any
   parsing or scheduling.
2. Body `{ "key": "<key>" }` failing the key charset → `400`.
3. Otherwise schedule a background render via `ctx.waitUntil` and return `202`
   immediately. The render screenshots `{FRAME_ORIGIN}/app/frame/{key}` at
   1200×630 (waiting for `data-scene-ready`) and writes the PNG to R2. It is
   bounded by `RENDER_DEADLINE_MS` (a timeout that closes the browser even on a
   hung page). All render failures are swallowed and logged — a failed render
   just leaves the default card in place until the next save re-nudges.

Renders are not single-flighted: two saves inside one render window launch two
concurrent renders of the same key, and the later-to-finish wins the R2 write —
so a slower render of an older save can briefly cache a stale image (corrected on
the next save). Spend is still capped (each save consumed a reservation), so this
is a quality edge, not a cost one.

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
  `SCREENSHOTS_ORIGIN` is set in `packages/app/wrangler.jsonc`. Unset → the app
  serves its static default card.
- **Rendering:** the backend only nudges `POST /render` when its own
  `SCREENSHOTS_ORIGIN` env var is set. Unset → saves behave exactly as before and
  nothing is ever rendered.

To enable end-to-end: deploy this Worker, set `RENDER_SECRET` on both sides,
smoke-test it, then set `SCREENSHOTS_ORIGIN` to its `*.workers.dev` host in both
the app Worker and the backend and redeploy.

CI deploys this Worker in its own `deploy-screenshots` job
(`.github/workflows/deploy-reusable.yml`), in parallel with and non-blocking to
the app deploy, so a failed/unprovisioned render deploy can never gate a release.

## Teardown (abandoning the experiment)

1. Remove `SCREENSHOTS_ORIGIN` from `packages/app/wrangler.jsonc` and the backend
   env (if set) and redeploy — the app reverts to the static default card and the
   backend stops nudging.
2. Delete the `deploy-screenshots` job from
   `.github/workflows/deploy-reusable.yml`.
3. `wrangler delete` the `math3d-screenshots` Worker and `wrangler secret delete
RENDER_SECRET`.
4. Delete the R2 bucket `math3d-screenshots`.
5. Narrow `CLOUDFLARE_API_TOKEN` back to Workers-only scopes.
6. Delete this package (`packages/screenshots`). Nothing else imports it, so no
   other code changes are needed. (The backend's `scenes.screenshots` reservation
   module is a separate teardown — see ADR-0002.)

## Development

```bash
yarn workspace screenshots test        # vitest under @cloudflare/vitest-pool-workers
yarn workspace screenshots typecheck
yarn wrangler dev                       # from packages/screenshots (needs nodejs_compat)
```

Note: `vitest-pool-workers` resolves node builtins through Vite, so unit tests
pass even if `nodejs_compat` were missing — the flag can only be validated with
`wrangler dev`/`deploy`.
