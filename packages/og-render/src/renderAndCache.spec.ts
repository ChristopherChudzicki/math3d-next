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

it("skips (fail-open) AND logs when meta returns an unexpected status", async () => {
  stubMeta(503);
  const render = vi.fn();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  await renderAndCache(env as never, "k", render);
  expect(render).not.toHaveBeenCalled();
  // A 5xx is uncertainty, not a clean 404 decline — it must leave a trace.
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining("unexpected /meta/ status 503"),
  );
  errorSpy.mockRestore();
});

it("skips AND logs distinctly when the /meta/ check errors (timeout/network)", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("timeout");
    }),
  );
  const render = vi.fn();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  await renderAndCache(env as never, "k", render);
  expect(render).not.toHaveBeenCalled();
  // The background gate giving up on uncertainty is the silent failure the
  // logging exists to surface (finding 4) — distinct from the quiet 404.
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining("/meta/ check failed for key=k"),
    expect.any(Error),
  );
  errorSpy.mockRestore();
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

it("retains the lock as a cooldown and writes nothing when render throws", async () => {
  stubMeta(200);
  const render = vi.fn().mockRejectedValue(new Error("boom"));
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  await renderAndCache(env as never, "k", render); // must not throw
  expect(await env.OG_BUCKET.get(sceneImageKey("k"))).toBeNull(); // nothing cached
  // Deliberately NOT released: the lock stands as a cooldown so the next unfurl
  // can't instantly re-burn a full render on a scene that just failed
  // (finding 3). Stale-takeover reclaims it after the cooldown window.
  expect(await env.OG_BUCKET.get(lockKey("k"))).not.toBeNull();
  errorSpy.mockRestore();
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
