# screenshots

Dedicated Cloudflare Worker that renders a per-scene screenshot for each shared
math3d scene and caches it in R2. Its first consumer is the Open Graph card, but
the rendered PNG is a general primitive (thumbnails, galleries follow). It is
**intentionally isolated and abandonable**: it imports nothing from the rest of
the monorepo (only `@cloudflare/puppeteer` and its own relative modules), and
nothing in the monorepo imports it. Its sole coupling to the app is one
var-gated block in the app Worker.

Design + rationale: `docs/superpowers/specs/2026-08-08-og-per-scene-image-design.md`.

## What it does

`GET /screenshots/scene/{key}.png`:

1. R2 hit → serve the cached PNG (`Cache-Control: max-age=86400`).
2. Miss → serve the branded default card (`max-age=60`) **and** schedule a
   background render via `ctx.waitUntil`: acquire a per-key R2 lock, confirm the
   scene exists via the pass-1 `/meta/` endpoint, screenshot
   `{FRAME_ORIGIN}/app/frame/{key}` at 1200×630 (waiting for `data-scene-ready`),
   write the PNG to R2, release the lock.
3. Invalid key or default-fetch failure → serve/redirect to the default; never
   500s.

`GET /health` → `200 ok`.

## Required infrastructure (not created by `wrangler deploy`)

`wrangler deploy` uploads the script and **binds** resources; it does not create
them. Before the Worker can render, provision on the Cloudflare account:

- **R2 bucket** `math3d-screenshots` (bound as `SCREENSHOTS_BUCKET`).
- **Browser Rendering** entitlement enabled (bound as `BROWSER`).
- **R2 lifecycle rule** expiring the `screenshots/lock/` prefix after ~1 day.
  This is a backstop only — the lock is self-healing (a stale lock older than
  ~2 min is taken over, see `lock.ts`) — but the rule bounds worst-case lock
  buildup and should still exist.
- **CI token scopes:** `CLOUDFLARE_API_TOKEN` needs Browser Rendering (edit) and
  R2 (edit) in addition to Workers Scripts, or the deploy/runtime fails.

`compatibility_flags: ["nodejs_compat"]` is required (`@cloudflare/puppeteer`
imports node builtins) and is set in `wrangler.jsonc`. Do not remove it — the
bundle uploads with only a warning but the Worker then 500s on every request.

## Enabling / disabling the feature (the dark switch)

The app Worker only points `og:image` at this Worker when `SCREENSHOTS_ORIGIN` is
set in `packages/app/wrangler.jsonc`. Unset (the default) → the app serves its
static default card and this Worker is dormant. To enable: deploy this Worker,
smoke-test it, then set `SCREENSHOTS_ORIGIN` to its `*.workers.dev` host and
redeploy the app Worker.

CI deploys this Worker in its own `deploy-screenshots` job
(`.github/workflows/deploy-reusable.yml`), in parallel with and non-blocking to
the app deploy, so a failed/unprovisioned render deploy can never gate a release.

## Teardown (abandoning the experiment)

1. Remove `SCREENSHOTS_ORIGIN` from `packages/app/wrangler.jsonc` (if set) and
   redeploy the app Worker — the app reverts to the static default card.
2. Delete the `deploy-screenshots` job from
   `.github/workflows/deploy-reusable.yml`.
3. `wrangler delete` the `math3d-screenshots` Worker.
4. Delete the R2 bucket `math3d-screenshots` and its lifecycle rule.
5. Narrow `CLOUDFLARE_API_TOKEN` back to Workers-only scopes.
6. Delete this package (`packages/screenshots`). Nothing else imports it, so no
   other code changes are needed.

## Development

```bash
yarn workspace screenshots test        # vitest under @cloudflare/vitest-pool-workers
yarn workspace screenshots typecheck
yarn wrangler dev                       # from packages/screenshots (needs nodejs_compat)
```

Note: `vitest-pool-workers` resolves node builtins through Vite, so unit tests
pass even if `nodejs_compat` were missing — the flag can only be validated with
`wrangler dev`/`deploy`.
