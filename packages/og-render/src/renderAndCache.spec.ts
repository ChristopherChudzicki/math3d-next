import { env } from "cloudflare:test";
import { afterEach, expect, it, vi } from "vitest";
import { renderAndCache } from "./renderAndCache";
import { sceneImageKey, lockKey } from "./keys";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

const stubMeta = (status: number) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status })),
  );

afterEach(async () => {
  vi.unstubAllGlobals();
  await env.OG_BUCKET.delete(sceneImageKey("k"));
  await env.OG_BUCKET.delete(lockKey("k"));
});

it("renders and caches when the scene exists (meta 200)", async () => {
  stubMeta(200);
  const render = vi.fn().mockResolvedValue(PNG);
  await renderAndCache(env as never, "k", render);
  expect(render).toHaveBeenCalledWith(env, "k");
  const stored = await env.OG_BUCKET.get(sceneImageKey("k"));
  expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(PNG);
  expect(await env.OG_BUCKET.get(lockKey("k"))).toBeNull(); // lock released
});

it("skips rendering when the scene does not exist (meta 404)", async () => {
  stubMeta(404);
  const render = vi.fn();
  await renderAndCache(env as never, "k", render);
  expect(render).not.toHaveBeenCalled();
  expect(await env.OG_BUCKET.get(sceneImageKey("k"))).toBeNull();
  expect(await env.OG_BUCKET.get(lockKey("k"))).toBeNull(); // released on skip
});

it("skips (fail-open) when meta errors (5xx)", async () => {
  stubMeta(503);
  const render = vi.fn();
  await renderAndCache(env as never, "k", render);
  expect(render).not.toHaveBeenCalled();
});

it("no-ops AND preserves the existing lock when already held", async () => {
  // Fresh timestamp: a currently-held (not stale) lock must block and survive.
  await env.OG_BUCKET.put(lockKey("k"), String(Date.now()));
  stubMeta(200);
  const render = vi.fn();
  await renderAndCache(env as never, "k", render);
  expect(render).not.toHaveBeenCalled();
  // The winner's lock must survive: a mis-impl that acquires INSIDE the
  // try/finally would delete it here, breaking single-flight.
  expect(await env.OG_BUCKET.get(lockKey("k"))).not.toBeNull();
});

it("releases the lock and writes nothing when render throws", async () => {
  stubMeta(200);
  const render = vi.fn().mockRejectedValue(new Error("boom"));
  await renderAndCache(env as never, "k", render); // must not throw
  expect(await env.OG_BUCKET.get(sceneImageKey("k"))).toBeNull();
  expect(await env.OG_BUCKET.get(lockKey("k"))).toBeNull();
});

it("never rejects even if an R2 op throws, and logs the failure", async () => {
  stubMeta(200);
  const render = vi.fn().mockResolvedValue(PNG);
  const delSpy = vi
    .spyOn(env.OG_BUCKET, "delete")
    .mockRejectedValueOnce(new Error("r2 down"));
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(
    renderAndCache(env as never, "k", render),
  ).resolves.toBeUndefined();
  // The silent fire-and-forget path must leave a trace when it fails.
  expect(errorSpy).toHaveBeenCalledWith(
    "renderAndCache failed for key=k",
    expect.any(Error),
  );
  delSpy.mockRestore();
  errorSpy.mockRestore();
});
