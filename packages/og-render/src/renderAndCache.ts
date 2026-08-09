import type { Env } from "./env";
import { acquireLock, releaseLock } from "./lock";
import { sceneImageKey } from "./keys";
import { renderScene as defaultRenderScene } from "./render";

const META_TIMEOUT_MS = 800;

type Renderer = (env: Env, key: string) => Promise<Uint8Array>;

/**
 * Existence gate: the pass-1 read-only /meta/ endpoint. A 200 means a migrated
 * scene exists (render it). A 404 means unknown/legacy (do NOT spend a render —
 * quota protection against key enumeration). Any other status or a timeout →
 * fail open by NOT rendering (retry on a later unfurl); never spends a render on
 * uncertainty.
 *
 * Note: /meta/ serves MIGRATED scenes only, so a legit legacy scene never opened
 * in-app 404s here and won't render until its first in-app open migrates it —
 * identical to pass-1's title behavior, acceptable (default card until then).
 *
 * Bare URL string → no cookies/headers forwarded to the public endpoint. The
 * render browser likewise carries no credentials (fresh context — see render.ts),
 * so we only ever render what an anonymous viewer could see.
 */
const sceneExists = async (env: Env, key: string): Promise<boolean> => {
  try {
    const res = await fetch(`${env.API_BASE}/v1/scenes/${key}/meta/`, {
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    return res.status === 200;
  } catch {
    return false;
  }
};

/**
 * Background render flow. Guarded by the per-key lock; existence-gated; all
 * failures swallowed so the already-served default/cached response stands. Never
 * throws (safe for ctx.waitUntil). `render` is injected for testability;
 * production uses the real Browser Rendering path by default.
 */
export const renderAndCache = async (
  env: Env,
  key: string,
  render: Renderer = defaultRenderScene,
): Promise<void> => {
  if (!(await acquireLock(env, key))) return;
  try {
    if (!(await sceneExists(env, key))) return;
    const png = await render(env, key);
    await env.OG_BUCKET.put(sceneImageKey(key), png, {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { renderedAt: new Date().toISOString() },
    });
  } catch {
    // swallow: quota 429, launch throttle, nav error, timeout, meta hiccup.
    // Next unfurl retries naturally.
  } finally {
    await releaseLock(env, key);
  }
};
