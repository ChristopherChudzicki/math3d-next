import type { Env } from "./env";

/**
 * Render the scene's frame page to a 1200x630 PNG via Browser Rendering.
 * Placeholder until Task 5; unit tests mock this module so orchestration is
 * testable without a real browser.
 */
export const renderScene = async (
  _env: Env,
  _key: string,
): Promise<Uint8Array> => {
  throw new Error("renderScene not implemented (Task 5)");
};
