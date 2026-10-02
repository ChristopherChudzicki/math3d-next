/**
 * Dedicated per-scene screenshot render Worker (own workers.dev host).
 *
 * `GET /screenshots/scene/{key}.png` is a pure cache-serve: it serves the
 * cached R2 PNG on a hit, or the branded default card on a miss/invalid-key/
 * cache-read-failure. It NEVER renders or schedules a render (ADR-0002 —
 * rendering is nudged separately, by the backend, on scene create/update).
 * The endpoint never blocks on or 500s — every response returns a valid image
 * immediately, except that `?fallback=none` (the app's scene-card thumbnails,
 * which draw their own placeholder) turns the default card into a 404.
 *
 * Bindings (wrangler.jsonc): BROWSER (Browser Rendering), SCREENSHOTS_BUCKET (R2
 * bucket `math3d-screenshots`). FRAME_ORIGIN is a deploy-injected var (see
 * deploy-reusable.yml). Requires the nodejs_compat compatibility flag
 * (@cloudflare/puppeteer imports node builtins).
 *
 * Wired into the app Worker (og:image) and the backend (render nudges, My Scenes
 * thumbnail URLs) via their `SCREENSHOTS_ORIGIN` vars; unset = that side is dark. Design + teardown: packages/screenshots/README.md,
 * docs/superpowers/specs/2026-08-15-screenshot-cost-protection-design.md (ADR-0002,
 * generate-on-POST), building on .../2026-08-08-og-per-scene-image-design.md.
 */
import type { Env } from "./env";
import { KEY_RE, VERSION_RE, sceneImageKey, sceneImagePathToKey } from "./keys";
import { renderAndCache } from "./renderAndCache";

const DEFAULT_IMAGE_PATH = "/og/default.png";

const serveDefault = async (env: Env): Promise<Response> => {
  const defaultUrl = `${env.FRAME_ORIGIN}${DEFAULT_IMAGE_PATH}`;
  try {
    const res = await fetch(defaultUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`default image ${res.status}`);
    // Buffer the whole (small) card before responding: streaming res.body keeps
    // the 3s abort signal attached, which would error a still-streaming body and
    // hand a slow crawler a truncated 200 image/png — the exact corrupt card the
    // catch below exists to prevent, but occurring outside it.
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

/**
 * Whether a hit is the render of the scene version `v` names (the app's
 * thumbnails ask with one; og:image doesn't, and any hit is current for it).
 * Renders carry the version the backend asked for; ones from before versions
 * existed fall back to comparing their upload time with `v`, a date.
 */
const isCurrentRender = (cached: R2Object, v: string | null): boolean => {
  if (v === null) return true;
  const version = cached.customMetadata?.version;
  if (version !== undefined) return version === v;
  return !(cached.uploaded.getTime() < Date.parse(v));
};

/**
 * A miss under `?fallback=none`: the card's <img> errors and keeps its
 * placeholder. Short-lived, like the default card, so a render that lands
 * shortly after a save shows up on a later load.
 */
const serveNotFound = (): Response =>
  new Response("not found", {
    status: 404,
    headers: { "cache-control": "public, max-age=60" },
  });

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname === "/health") return new Response("ok");

    if (request.method === "POST" && pathname === "/render") {
      // Secret gate before any parsing/scheduling; fail CLOSED on an unset/empty
      // secret — otherwise the required header degenerates to a guessable
      // `Bearer undefined`/`Bearer ` and anyone could drive uncapped rendering.
      const auth = request.headers.get("authorization");
      if (!env.RENDER_SECRET || auth !== `Bearer ${env.RENDER_SECRET}`) {
        return new Response("forbidden", { status: 403 });
      }
      let body: { key?: unknown; version?: unknown } = {};
      try {
        body = (await request.json()) as typeof body;
      } catch {
        // Falls through to the 400 below.
      }
      const { key, version } = body ?? {};
      if (typeof key !== "string" || !KEY_RE.test(key)) {
        return new Response("bad request", { status: 400 });
      }
      // Optional: a backend from before versions existed sends none.
      if (
        version !== undefined &&
        (typeof version !== "string" || !VERSION_RE.test(version))
      ) {
        return new Response("bad request", { status: 400 });
      }
      ctx.waitUntil(renderAndCache(env, key, version));
      return new Response(null, { status: 202 });
    }

    const serveMiss = async (): Promise<Response> =>
      searchParams.get("fallback") === "none"
        ? serveNotFound()
        : serveDefault(env);

    const key = sceneImagePathToKey(pathname);
    if (key === null) return serveMiss();

    let cached: R2ObjectBody | null;
    try {
      cached = await env.SCREENSHOTS_BUCKET.get(sceneImageKey(key));
    } catch (err) {
      // A cache read failing (R2 outage/throttle/5xx) is operationally
      // identical to a miss — degrade to the default card, never let it 500 out
      // of fetch.
      // eslint-disable-next-line no-console
      console.error(`cache read failed for key=${key}`, err);
      return serveMiss();
    }
    if (cached !== null) {
      // Not the requested version: the save's render may still be in flight.
      // Cache briefly, or the browser would keep this image under the new URL.
      const current = isCurrentRender(cached, searchParams.get("v"));
      return new Response(cached.body, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": `public, max-age=${current ? 86400 : 60}`,
        },
      });
    }

    return serveMiss();
  },
};
