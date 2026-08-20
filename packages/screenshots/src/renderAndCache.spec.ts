import { env } from "cloudflare:test";
import { afterEach, expect, it, vi } from "vitest";
import { renderAndCache } from "./renderAndCache";
import { sceneImageKey } from "./keys";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

afterEach(async () => {
  vi.unstubAllGlobals();
  await env.SCREENSHOTS_BUCKET.delete(sceneImageKey("k"));
});

it("renders and caches (no lock, no existence gate)", async () => {
  const render = vi.fn().mockResolvedValue(PNG);
  await renderAndCache(env as never, "k", render);
  expect(render).toHaveBeenCalledWith(env, "k", env.RENDER_DEADLINE_MS);
  const stored = await env.SCREENSHOTS_BUCKET.get(sceneImageKey("k"));
  expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(PNG);
});

it("swallows a render failure without throwing or storing", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const render = vi.fn().mockRejectedValue(new Error("boom"));
  await renderAndCache(env as never, "k", render); // must not reject
  expect(await env.SCREENSHOTS_BUCKET.get(sceneImageKey("k"))).toBeNull();
  errorSpy.mockRestore();
});
