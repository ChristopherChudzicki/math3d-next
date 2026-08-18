/**
 * Dedicated per-scene screenshot render Worker (own workers.dev host).
 *
 * `GET /screenshots/scene/{key}.png` is a pure cache-serve: it serves the
 * cached R2 PNG on a hit, or the branded default card on a miss/invalid-key/
 * cache-read-failure. It NEVER renders or schedules a render (ADR-0002 —
 * rendering is nudged separately, by the backend, on scene create/update).
 * The endpoint never blocks on or 500s — every response returns a valid image
 * immediately.
 *
 * Bindings (wrangler.jsonc): BROWSER (Browser Rendering), SCREENSHOTS_BUCKET (R2
 * bucket `math3d-screenshots`), var FRAME_ORIGIN. Requires the nodejs_compat
 * compatibility flag (@cloudflare/puppeteer imports node builtins).
 *
 * Wired into the app Worker via the single `SCREENSHOTS_ORIGIN` var; unset there =
 * the whole feature is dark. Design + teardown: packages/screenshots/README.md and
 * docs/superpowers/specs/2026-08-08-og-per-scene-image-design.md.
 */
import type { Env } from "./env";
import { sceneImageKey, sceneImagePathToKey } from "./keys";
// NOTE: renderAndCache is unused by the GET (pure cache-serve, ADR-0002) and is
// deliberately not imported here — Task 7 re-adds it for POST /render.

const DEFAULT_IMAGE_PATH = "/og/default.png";

const serveDefault = async (env: Env): Promise<Response> => {
  const defaultUrl = `${env.FRAME_ORIGIN}${DEFAULT_IMAGE_PATH}`;
  try {
    const res = await fetch(defaultUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`default image ${res.status}`);
    // Buffer the whole (small) card before responding: streaming res.body keeps
    // the 3s abort signal attached, which would error a still-streaming body and
    // hand a slow crawler a truncated 200 image/png — the exact corrupt card the
    // catch below exists to prevent, but occurring outside it (finding 5).
    const body = await res.arrayBuffer();
    return new Response(body, {
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

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return new Response("ok");

    const key = sceneImagePathToKey(pathname);
    if (key === null) return serveDefault(env);

    let cached: R2ObjectBody | null;
    try {
      cached = await env.SCREENSHOTS_BUCKET.get(sceneImageKey(key));
    } catch (err) {
      // A cache read failing (R2 outage/throttle/5xx) is operationally
      // identical to a miss — degrade to the default card, never let it 500 out
      // of fetch (finding 1).
      // eslint-disable-next-line no-console
      console.error(`cache read failed for key=${key}`, err);
      return serveDefault(env);
    }
    if (cached !== null) {
      return new Response(cached.body, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    return serveDefault(env);
  },
};
