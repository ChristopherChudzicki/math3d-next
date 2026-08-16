import type { Env } from "./env";
import { acquireLock, releaseLock } from "./lock";
import { sceneImageKey } from "./keys";
import { renderScene as defaultRenderScene } from "./render";

/**
 * Existence gate against the pass-1 /meta/ endpoint. This runs on a background
 * ctx.waitUntil task with nobody waiting on the response, so it gets seconds
 * rather than the app Worker's latency-critical 800ms — a cold Heroku dyno
 * routinely blows a sub-second budget, which here would silently skip the
 * render (see the catch). Seconds, not minutes: still bounds a wedged backend.
 */
const META_TIMEOUT_MS = 5_000;

type Renderer = (env: Env, key: string) => Promise<Uint8Array>;

/**
 * Existence gate: the pass-1 read-only /meta/ endpoint. A 200 means a migrated
 * scene exists (render it). A 404 means unknown/legacy (do NOT spend a render —
 * quota protection against key enumeration). Any other status or a timeout →
 * fail open by NOT rendering (retry on a later unfurl); never spends a render on
 * uncertainty.
 *
 * A 404 is a correct, expected decline and stays quiet. A timeout, network
 * error, or unexpected status is us *giving up on uncertainty* — logged
 * distinctly, because on this fire-and-forget path it is otherwise the silent
 * reason a scene's image "just never appears" (finding 4).
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
    if (res.status === 200) return true;
    if (res.status === 404) return false; // correct decline — expected, quiet
    // eslint-disable-next-line no-console
    console.error(
      `sceneExists: unexpected /meta/ status ${res.status} for key=${key}`,
    );
    return false;
  } catch (err) {
    // Timeout or network error: we couldn't confirm the scene, so we decline —
    // but noisily, because a silent skip here is exactly the traceless failure
    // the background-path logging is meant to eliminate.
    // eslint-disable-next-line no-console
    console.error(`sceneExists: /meta/ check failed for key=${key}`, err);
    return false;
  }
};

/**
 * Background render flow. Guarded by the per-key lock; existence-gated; all
 * failures swallowed — including R2 hiccups from acquireLock/releaseLock
 * themselves, not just render/put — so the already-served default/cached
 * response stands. Structurally never throws (safe for ctx.waitUntil): the
 * outer try/catch wraps the entire body, including lock acquisition and
 * release, so no exception from any awaited call can escape. `render` is
 * injected for testability; production uses the real Browser Rendering path
 * by default.
 *
 * On success (or a clean 404 decline) the lock is released. On a render/put
 * FAILURE the lock is deliberately left in place (finding 3): it becomes a
 * cooldown, so a scene that keeps failing to render — heavy geometry, a JS
 * error, an unlucky browser — cannot re-burn ~50s of Browser Rendering on
 * *every* unfurl and drain the daily quota for every other scene. The stale
 * takeover path reclaims it after ~LOCK_STALE_MS for a fresh retry.
 */
export const renderAndCache = async (
  env: Env,
  key: string,
  render: Renderer = defaultRenderScene,
): Promise<void> => {
  let token: string | null = null;
  try {
    token = await acquireLock(env, key);
    if (token === null) return;

    if (!(await sceneExists(env, key))) {
      // Not a render failure — release so a later unfurl (post-migration or
      // once the backend recovers) can retry promptly rather than wait out the
      // cooldown.
      await releaseLock(env, key, token);
      return;
    }

    const png = await render(env, key);
    await env.SCREENSHOTS_BUCKET.put(sceneImageKey(key), png, {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { renderedAt: new Date().toISOString() },
    });
    await releaseLock(env, key, token);
  } catch (err) {
    // swallow everything: acquireLock/releaseLock R2 hiccups, quota 429,
    // launch throttle, nav error, timeout, meta hiccup. Never propagates —
    // safe for ctx.waitUntil. The lock is intentionally NOT released here: on a
    // render/put failure it stands as a cooldown (finding 3). LOG first: this
    // path is fire-and-forget inside ctx.waitUntil, so a silent failure is why
    // a scene's image would "just never appear" with nothing to see.
    // eslint-disable-next-line no-console
    console.error(`renderAndCache failed for key=${key}`, err);
  }
};
