import {
  createExecutionContext,
  waitOnExecutionContext,
  env,
} from "cloudflare:test";
import { afterEach, expect, it, vi } from "vitest";
import worker from "./index";
import { sceneImageKey } from "./keys";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // "\x89PNG"
const DEFAULT_PNG = new Uint8Array([1, 2, 3, 4]);

/**
 * Stub global fetch for BOTH subrequests the miss path makes: the default-PNG
 * fetch (FRAME_ORIGIN/og/default.png) and the /meta/ existence check that the
 * scheduled render fires (Task 4). Default to meta-404 so no real render runs.
 */
const stubFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      String(url).includes("/og/default.png")
        ? new Response(DEFAULT_PNG, {
            headers: { "content-type": "image/png" },
          })
        : new Response("{}", { status: 404 }),
    ),
  );

const call = async (path: string) => {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request(`https://render.test${path}`),
    env as never,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
};

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await env.OG_BUCKET.delete(sceneImageKey("hit"));
});

it("responds ok on /health", async () => {
  const res = await call("/health");
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("ok");
});

it("serves cached PNG on an R2 hit with a long cache header", async () => {
  await env.OG_BUCKET.put(sceneImageKey("hit"), PNG, {
    httpMetadata: { contentType: "image/png" },
  });
  const res = await call("/og/scene/hit.png");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  expect(res.headers.get("cache-control")).toContain("max-age=86400");
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
});

it("serves the branded default on a miss with a short cache header", async () => {
  stubFetch();
  const res = await call("/og/scene/missing.png");
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toContain("max-age=60");
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  expect(fetch).toHaveBeenCalledWith(
    "https://next.math3d.org/og/default.png",
    expect.anything(),
  );
});

it("redirects to the default URL (not a 500 or corrupt body) when the default-PNG fetch itself fails", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      String(url).includes("/og/default.png")
        ? Promise.reject(new Error("network down"))
        : new Response("{}", { status: 404 }),
    ),
  );
  const res = await call("/og/scene/missing.png");
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(
    "https://next.math3d.org/og/default.png",
  );
  errorSpy.mockRestore();
});

it("serves default for an invalid key WITHOUT querying R2 or scheduling a render", async () => {
  stubFetch();
  const getSpy = vi.spyOn(env.OG_BUCKET, "get");
  const res = await call("/og/scene/bad key.png");
  expect(res.status).toBe(200);
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  // The invalid-key branch returns before the R2 lookup / render scheduling —
  // the ONLY thing distinguishing it from the miss branch.
  expect(getSpy).not.toHaveBeenCalled();
  // Only the default-PNG fetch happened; no /meta/ existence check.
  expect(fetch).toHaveBeenCalledTimes(1);
});
