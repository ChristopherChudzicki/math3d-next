/**
 * Dedicated per-scene OG image render Worker (own workers.dev host).
 *
 * `GET /og/scene/{key}.png` serves the cached R2 PNG on a hit, or the branded
 * default card on a miss while scheduling a background render of
 * `{FRAME_ORIGIN}/app/frame/{key}` (Browser Rendering → R2) via ctx.waitUntil.
 * Single-flighted by a per-key R2 lock, existence-gated against `/meta/`. The
 * endpoint never blocks on or 500s from a render — a miss always returns a valid
 * image immediately.
 *
 * Bindings (wrangler.jsonc): BROWSER (Browser Rendering), OG_BUCKET (R2 bucket
 * `math3d-og-images`), vars FRAME_ORIGIN + API_BASE. Requires the nodejs_compat
 * compatibility flag (@cloudflare/puppeteer imports node builtins).
 *
 * Wired into the app Worker via the single `OG_RENDER_ORIGIN` var; unset there =
 * the whole feature is dark. Design + teardown: packages/og-render/README.md and
 * docs/superpowers/specs/2026-08-08-og-per-scene-image-design.md.
 */
import type { Env } from "./env";
import { sceneImageKey, sceneImagePathToKey } from "./keys";
import { renderAndCache } from "./renderAndCache";

const DEFAULT_IMAGE_PATH = "/og/default.png";

const serveDefault = async (env: Env): Promise<Response> => {
  const defaultUrl = `${env.FRAME_ORIGIN}${DEFAULT_IMAGE_PATH}`;
  try {
    const res = await fetch(defaultUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`default image ${res.status}`);
    return new Response(res.body, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=60",
      },
    });
  } catch (err) {
    // This runs on EVERY miss and every invalid key. Never 500 the endpoint and
    // never stream a non-2xx body under an image/png wrapper (a corrupt card):
    // log the failure for observability, then redirect to the static default
    // so the crawler still gets a valid image.
    // eslint-disable-next-line no-console
    console.error(`serveDefault: failed to fetch ${defaultUrl}`, err);
    return Response.redirect(defaultUrl, 302);
  }
};

const scheduleRender = (env: Env, ctx: ExecutionContext, key: string): void => {
  ctx.waitUntil(renderAndCache(env, key));
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return new Response("ok");

    const key = sceneImagePathToKey(pathname);
    if (key === null) return serveDefault(env);

    const cached = await env.OG_BUCKET.get(sceneImageKey(key));
    if (cached !== null) {
      return new Response(cached.body, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    scheduleRender(env, ctx, key);
    return serveDefault(env);
  },
};
