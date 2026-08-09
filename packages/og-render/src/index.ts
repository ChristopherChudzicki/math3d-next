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
  } catch {
    // This runs on EVERY miss and every invalid key. Never 500 the endpoint and
    // never stream a non-2xx body under an image/png wrapper (a corrupt card):
    // on any failure, redirect to the static default so the crawler still gets a
    // valid image.
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
