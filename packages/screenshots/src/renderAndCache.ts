import type { Env } from "./env";
import { sceneImageKey } from "./keys";
import { renderScene as defaultRenderScene } from "./render";

type Renderer = (env: Env, key: string) => Promise<Uint8Array>;

/**
 * Render {key} and cache the PNG in R2. Structurally never throws (safe for
 * ctx.waitUntil): the whole body is wrapped so no awaited call escapes. The
 * backend only nudges scenes it persisted, so there is no existence gate and no
 * per-key lock (both were crawler-race machinery, deleted in ADR-0002). `render`
 * is injected for testability. LOG on failure — this runs fire-and-forget, so a
 * silent failure is why an image would "just never appear".
 */
export const renderAndCache = async (
  env: Env,
  key: string,
  render: Renderer = defaultRenderScene,
): Promise<void> => {
  try {
    const png = await render(env, key);
    await env.SCREENSHOTS_BUCKET.put(sceneImageKey(key), png, {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { renderedAt: new Date().toISOString() },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`renderAndCache failed for key=${key}`, err);
  }
};
