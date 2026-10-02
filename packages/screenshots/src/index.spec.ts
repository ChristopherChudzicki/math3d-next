import {
  createExecutionContext,
  waitOnExecutionContext,
  env,
} from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";
import { sceneImageKey } from "./keys";
import { renderScene } from "./render";

// Mock the whole ./render module so POST /render tests never launch a real
// browser (env.BROWSER isn't a real Browser Rendering binding in tests) — the
// route calls renderAndCache(env, key) with its default renderer
// (renderScene from ./render), so this is the seam to stub.
vi.mock("./render", () => ({ renderScene: vi.fn() }));

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // "\x89PNG"
const DEFAULT_PNG = new Uint8Array([1, 2, 3, 4]);

/**
 * Stub global fetch for the only subrequest a miss makes: the default-PNG
 * fetch (FRAME_ORIGIN/og/default.png). No existence check exists anymore — a
 * miss never renders — so there is nothing else to stub.
 */
const stubFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(DEFAULT_PNG, { headers: { "content-type": "image/png" } }),
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

const post = async (
  body: unknown,
  headers: Record<string, string> = {},
  envOverride: Record<string, unknown> = {},
) => {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request("https://render.test/render", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    }),
    { ...env, ...envOverride } as never,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
};

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // vi.restoreAllMocks() only restores vi.spyOn() spies to their original
  // implementation — it doesn't reset a plain vi.fn() from a vi.mock()
  // factory, so the module-level renderScene mock needs an explicit reset or
  // its call history (and any mockResolvedValueOnce queue) leaks into later
  // tests.
  vi.mocked(renderScene).mockReset();
  await env.SCREENSHOTS_BUCKET.delete(sceneImageKey("hit"));
  await env.SCREENSHOTS_BUCKET.delete(sceneImageKey("good"));
});

it("responds ok on /health", async () => {
  const res = await call("/health");
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("ok");
});

it("serves cached PNG on an R2 hit with a long cache header, without any subrequest or render", async () => {
  stubFetch();
  await env.SCREENSHOTS_BUCKET.put(sceneImageKey("hit"), PNG, {
    httpMetadata: { contentType: "image/png" },
  });
  const res = await call("/screenshots/scene/hit.png");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  expect(res.headers.get("cache-control")).toContain("max-age=86400");
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  // The design requires a hit to serve with no subrequest and no render.
  expect(fetch).not.toHaveBeenCalled();
});

it("serves the default (not a 500) and schedules no render when the R2 cache read fails", async () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const getSpy = vi
    .spyOn(env.SCREENSHOTS_BUCKET, "get")
    .mockRejectedValueOnce(new Error("r2 down"));
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(DEFAULT_PNG, { headers: { "content-type": "image/png" } }),
    ),
  );
  const res = await call("/screenshots/scene/hit.png");
  // An R2 read failure degrades to the default card, never 500s...
  expect(res.status).toBe(200);
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  // ...and does NOT schedule a render (the GET never renders): only the
  // default-PNG fetch fires.
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    "https://next.math3d.org/og/default.png",
    expect.anything(),
  );
  getSpy.mockRestore();
  errorSpy.mockRestore();
});

it("serves the default on a miss and schedules no render", async () => {
  stubFetch();
  const res = await call("/screenshots/scene/missing.png");
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toContain("max-age=60");
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  expect(fetch).toHaveBeenCalledTimes(1); // only the default-PNG fetch
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
  const res = await call("/screenshots/scene/missing.png");
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(
    "https://next.math3d.org/og/default.png",
  );
  errorSpy.mockRestore();
});

it("serves default for an invalid key WITHOUT querying R2 or scheduling a render", async () => {
  stubFetch();
  const getSpy = vi.spyOn(env.SCREENSHOTS_BUCKET, "get");
  const res = await call("/screenshots/scene/bad key.png");
  expect(res.status).toBe(200);
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  // The invalid-key branch returns before the R2 lookup / render scheduling —
  // the ONLY thing distinguishing it from the miss branch.
  expect(getSpy).not.toHaveBeenCalled();
  // Only the default-PNG fetch happened.
  expect(fetch).toHaveBeenCalledTimes(1);
});

describe("?fallback=none", () => {
  it("404s on a miss, with a short cache header and no default-card fetch", async () => {
    stubFetch();
    const res = await call("/screenshots/scene/missing.png?fallback=none&v=1");
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("404s on an invalid key", async () => {
    stubFetch();
    const res = await call("/screenshots/scene/bad key.png?fallback=none");
    expect(res.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("404s (not a 500) when the R2 cache read fails", async () => {
    stubFetch();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(env.SCREENSHOTS_BUCKET, "get").mockRejectedValueOnce(
      new Error("r2 down"),
    );
    const res = await call("/screenshots/scene/hit.png?fallback=none");
    expect(res.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("still serves the cached PNG on a hit", async () => {
    stubFetch();
    await env.SCREENSHOTS_BUCKET.put(sceneImageKey("hit"), PNG, {
      httpMetadata: { contentType: "image/png" },
    });
    const res = await call("/screenshots/scene/hit.png?fallback=none&v=1");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age=86400");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  });

  describe("a hit's cache lifetime", () => {
    const V = "2026-10-02T01:53:32.123456+00:00";
    const putHit = (customMetadata?: Record<string, string>) =>
      env.SCREENSHOTS_BUCKET.put(sceneImageKey("hit"), PNG, {
        httpMetadata: { contentType: "image/png" },
        customMetadata,
      });
    const cacheControl = async (v: string) =>
      (
        await call(
          `/screenshots/scene/hit.png?fallback=none&v=${encodeURIComponent(v)}`,
        )
      ).headers.get("cache-control");

    it("is a day when the render is of the requested version", async () => {
      await putHit({ version: V });
      expect(await cacheControl(V)).toBe("public, max-age=86400");
    });

    it("is a minute when the render is of another version, since the requested one may be in flight", async () => {
      await putHit({ version: V });
      const later = "2026-10-02T01:53:32.123457+00:00";
      expect(await cacheControl(later)).toBe("public, max-age=60");
    });

    it("is a minute even when another version's render postdates v", async () => {
      // Two quick saves: the first save's render can land after the second
      // save. Upload time would call it current; its version says otherwise.
      await putHit({ version: "2020-01-01T00:00:00+00:00" });
      expect(await cacheControl("2020-01-01T00:00:01+00:00")).toBe(
        "public, max-age=60",
      );
    });

    describe("for a render from before versions existed", () => {
      it("is a minute when it was uploaded before v", async () => {
        await putHit();
        const future = new Date(Date.now() + 60_000).toISOString();
        expect(await cacheControl(future)).toBe("public, max-age=60");
      });

      it("is a day when it was uploaded after v (Django's microsecond isoformat)", async () => {
        await putHit();
        expect(await cacheControl("2020-01-01T00:00:00.123456+00:00")).toBe(
          "public, max-age=86400",
        );
      });
    });

    it("is a day without v (og:image), whatever the render's version", async () => {
      await putHit({ version: V });
      const res = await call("/screenshots/scene/hit.png");
      expect(res.headers.get("cache-control")).toBe("public, max-age=86400");
    });
  });

  it("serves the default card as before for any other fallback value", async () => {
    stubFetch();
    const res = await call("/screenshots/scene/missing.png?fallback=nope");
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(DEFAULT_PNG);
  });
});

it("202 + schedules a render for a valid secret + key", async () => {
  vi.mocked(renderScene).mockResolvedValueOnce(PNG);
  const res = await post({ key: "good" }, { authorization: "Bearer shh" });
  expect(res.status).toBe(202);
  const stored = await env.SCREENSHOTS_BUCKET.get(sceneImageKey("good"));
  expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(PNG);
});

it("stores the version a render was requested for", async () => {
  vi.mocked(renderScene).mockResolvedValueOnce(PNG);
  const res = await post(
    { key: "good", version: "2026-10-02T01:53:32+00:00" },
    { authorization: "Bearer shh" },
  );
  expect(res.status).toBe(202);
  const stored = await env.SCREENSHOTS_BUCKET.head(sceneImageKey("good"));
  expect(stored!.customMetadata?.version).toBe("2026-10-02T01:53:32+00:00");
});

it.each([
  ["a non-string", 1],
  ["an empty string", ""],
  ["an overlong string", "x".repeat(65)],
  ["whitespace", "a b"],
])("400 for %s version, without rendering", async (_, version) => {
  const res = await post(
    { key: "good", version },
    { authorization: "Bearer shh" },
  );
  expect(res.status).toBe(400);
  expect(renderScene).not.toHaveBeenCalled();
});

it("403 and never launches a browser without the secret", async () => {
  const res = await post({ key: "good" });
  expect(res.status).toBe(403);
  expect(renderScene).not.toHaveBeenCalled();
});

it("403 for a wrong secret", async () => {
  const res = await post({ key: "good" }, { authorization: "Bearer nope" });
  expect(res.status).toBe(403);
  expect(renderScene).not.toHaveBeenCalled();
});

it("403 (fails closed) when RENDER_SECRET is unset, even for a matching header", async () => {
  // With an empty secret the required header degenerates to `Bearer ` (and an
  // unbound secret to `Bearer undefined`) — both guessable. The gate must reject
  // regardless, so an unprovisioned secret can never authorize an uncapped render.
  const res = await post(
    { key: "good" },
    { authorization: "Bearer " },
    {
      RENDER_SECRET: "",
    },
  );
  expect(res.status).toBe(403);
  expect(renderScene).not.toHaveBeenCalled();
});

it("400 for an invalid key", async () => {
  const res = await post({ key: "bad key" }, { authorization: "Bearer shh" });
  expect(res.status).toBe(400);
  expect(renderScene).not.toHaveBeenCalled();
});
