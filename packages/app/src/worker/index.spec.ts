import { afterEach, expect, it, vi } from "vitest";
import worker from "./index";

const DEFAULT_TITLE = "Math3d: Online 3d Graphing Calculator";
const DEFAULT_ALT = "Math3d — interactive 3D graphing calculator";
const DEFAULT_OG_IMAGE = "https://next.math3d.org/og/default.png";

const SHELL_HTML = `<!doctype html><html><head>
<title>${DEFAULT_TITLE}</title>
<meta property="og:title" content="${DEFAULT_TITLE}" />
<meta name="twitter:title" content="${DEFAULT_TITLE}" />
<meta property="og:url" content="https://next.math3d.org/" />
<meta property="og:description" content="site tagline" />
<meta name="default-title" content="${DEFAULT_TITLE}" />
<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
<meta property="og:image:alt" content="${DEFAULT_ALT}" />
<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
<meta name="twitter:image:alt" content="${DEFAULT_ALT}" />
</head><body></body></html>`;

const makeEnv = () => ({
  ASSETS: {
    fetch: vi.fn(
      async () =>
        new Response(SHELL_HTML, { headers: { "content-type": "text/html" } }),
    ),
  },
  API_BASE: "https://api.example.test",
  // Deliberately distinct from the request host below, so tests pin that og:url
  // is built from SITE_ORIGIN, not the incoming request URL.
  SITE_ORIGIN: "https://og.math3d.test",
});

/** Stub the global fetch the Worker uses for the /meta/ lookup. */
const stubMeta = (init: ResponseInit, body?: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      body === undefined
        ? new Response("not json", init)
        : new Response(JSON.stringify(body), {
            headers: { "content-type": "application/json" },
            ...init,
          }),
    ),
  );

const call = (path: string, env: ReturnType<typeof makeEnv>) =>
  worker.fetch(
    new Request(`https://next.math3d.org${path}`, {
      headers: { "Sec-Fetch-Mode": "navigate", cookie: "sessionid=secret" },
    }),
    env as unknown as never,
  );

const tags = async (res: Response) => {
  const html = await res.text();
  const g = (re: RegExp) => html.match(re)?.[1] ?? null;
  return {
    raw: html,
    title: g(/<title>([^<]*)<\/title>/),
    ogTitle: g(/property="og:title" content="([^"]*)"/),
    twitterTitle: g(/name="twitter:title" content="([^"]*)"/),
    ogUrl: g(/property="og:url" content="([^"]*)"/),
    ogDesc: g(/property="og:description" content="([^"]*)"/),
    defaultTitle: g(/name="default-title" content="([^"]*)"/),
    ogImage: g(/property="og:image" content="([^"]*)"/),
    twitterImage: g(/name="twitter:image" content="([^"]*)"/),
    ogImageAlt: g(/property="og:image:alt" content="([^"]*)"/),
    twitterImageAlt: g(/name="twitter:image:alt" content="([^"]*)"/),
  };
};

afterEach(() => vi.restoreAllMocks());

it("rewrites the title tags on a titled scene", async () => {
  stubMeta({ status: 200 }, { title: "My Torus" });
  const t = await tags(await call("/abc123", makeEnv()));
  expect(t.title).toBe("My Torus | Math3d");
  expect(t.ogTitle).toBe("My Torus");
  expect(t.twitterTitle).toBe("My Torus");
  expect(t.ogUrl).toBe("https://og.math3d.test/abc123");
  // left at their index.html defaults:
  expect(t.ogDesc).toBe("site tagline");
  expect(t.defaultTitle).toBe(DEFAULT_TITLE);
});

it("overrides Cache-Control so intermediaries don't cache per-scene HTML", async () => {
  stubMeta({ status: 200 }, { title: "My Torus" });
  const res = await call("/abc123", makeEnv());
  expect(res.headers.get("cache-control")).toContain("private");
});

it("keeps the shell's default title for an untitled scene but still rewrites og:url", async () => {
  // "Untitled" (the DB default) represents the untitled branch; that blank and
  // whitespace also collapse to untitled is the shared helper's job, pinned in
  // sceneTitle.spec.ts. Here the Worker leaves the shell's rich defaults for
  // the title tags but still points og:url at this scene's canonical URL.
  stubMeta({ status: 200 }, { title: "Untitled" });
  const t = await tags(await call("/abc123", makeEnv()));
  expect(t.title).toBe(DEFAULT_TITLE);
  expect(t.ogTitle).toBe(DEFAULT_TITLE);
  expect(t.ogUrl).toBe("https://og.math3d.test/abc123");
});

it("escapes a hostile title (no tag/attribute breakout)", async () => {
  stubMeta({ status: 200 }, { title: '"><img src=x onerror=alert(1)>' });
  const res = await call("/abc123", makeEnv());
  // Re-parse the output. A successful breakout — from the <title> inner content
  // or an og:title/twitter:title attribute value — would introduce a real <img>
  // element. HTMLRewriter matches only actual elements, never escaped text or
  // quoted attribute values, so any match here means escaping failed.
  let imgElements = 0;
  await new HTMLRewriter()
    .on("img", {
      element() {
        imgElements += 1;
      },
    })
    .transform(res)
    .text();
  expect(imgElements).toBe(0);
});

it.each(["/app", "/app/frame/x", "/foo.png", "/", "/x"])(
  "passes through non-candidate/invalid paths without touching /meta/ (%s)",
  async (path) => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const res = await call(path, makeEnv());
    expect(spy).not.toHaveBeenCalled(); // no /meta/ fetch
    expect(await res.text()).toContain(`<title>${DEFAULT_TITLE}</title>`);
  },
);

it.each([
  ["404", { status: 404 } as ResponseInit, { title: "ignored" }],
  ["malformed 200 body", { status: 200 } as ResponseInit, undefined],
  ["missing title field", { status: 200 } as ResponseInit, { notTitle: 1 }],
])("serves default tags on %s", async (_label, init, body) => {
  stubMeta(init, body);
  const t = await tags(await call("/abc123", makeEnv()));
  expect(t.title).toBe(DEFAULT_TITLE);
  expect(t.ogTitle).toBe(DEFAULT_TITLE);
});

it("fails open AND marks the response private when the /meta/ fetch rejects", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network down");
    }),
  );
  const res = await call("/abc123", makeEnv());
  // A transient backend failure must not let a titleless generic shell be
  // cached by a shared intermediary under this scene's URL.
  expect(res.headers.get("cache-control")).toContain("private");
  expect((await tags(res)).title).toBe(DEFAULT_TITLE);
});

it("fetches /meta/ with a bare URL and forwards no request headers/cookies", async () => {
  const spy = vi.fn(
    async () =>
      new Response(JSON.stringify({ title: "X" }), {
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", spy);
  await call("/abc123", makeEnv());
  expect(spy).toHaveBeenCalledTimes(1);
  const [input, init] = spy.mock.calls[0] as unknown as [string, RequestInit?];
  expect(input).toBe("https://api.example.test/v1/scenes/abc123/meta/");
  expect(init?.headers).toBeUndefined();
});

it("rewrites og:image/twitter:image + both alts when OG_RENDER_ORIGIN is set", async () => {
  const env = { ...makeEnv(), OG_RENDER_ORIGIN: "https://render.math3d.test" };
  stubMeta({ status: 200 }, { title: "My Scene" });
  const res = await call("/abc123", env);
  const t = await tags(res);
  expect(t.ogImage).toBe("https://render.math3d.test/og/scene/abc123.png");
  expect(t.twitterImage).toBe("https://render.math3d.test/og/scene/abc123.png");
  expect(t.ogImageAlt).toBe("My Scene");
  expect(t.twitterImageAlt).toBe("My Scene"); // twitter alt is a plausible copy-paste miss
});

it("normalizes a trailing slash on OG_RENDER_ORIGIN so the image URL stays valid", async () => {
  // A stray trailing slash is the most ordinary paste error on the one
  // hand-typed rollout step; it must not double the slash and break the render
  // Worker's `^/og/scene/` matcher (which would serve the default forever).
  const env = { ...makeEnv(), OG_RENDER_ORIGIN: "https://render.math3d.test/" };
  stubMeta({ status: 200 }, { title: "My Scene" });
  const t = await tags(await call("/abc123", env));
  expect(t.ogImage).toBe("https://render.math3d.test/og/scene/abc123.png");
  expect(t.twitterImage).toBe("https://render.math3d.test/og/scene/abc123.png");
});

it("rewrites og:image for an untitled scene but leaves the alt at the default", async () => {
  const env = { ...makeEnv(), OG_RENDER_ORIGIN: "https://render.math3d.test" };
  stubMeta({ status: 200 }, { title: "" });
  const res = await call("/abc123", env);
  const t = await tags(res);
  // Image is rewritten unconditionally; alt is title-gated (untitled → keep the
  // generic shell alt, not an empty string). Pins alt-gated-but-image-not.
  expect(t.ogImage).toBe("https://render.math3d.test/og/scene/abc123.png");
  expect(t.ogImageAlt).toBe(DEFAULT_ALT);
  expect(t.twitterImageAlt).toBe(DEFAULT_ALT);
});

it("leaves og:image AND both alts at the static defaults for a titled scene when OG_RENDER_ORIGIN is unset", async () => {
  // Titled scene deliberately: the image and its alt must move together. With
  // the render Worker not configured, a titled scene must still show the static
  // default card — so its alt must stay the default too, not describe a
  // per-scene image that was never substituted (abandonability invariant).
  stubMeta({ status: 200 }, { title: "My Scene" });
  const res = await call("/abc123", makeEnv()); // no OG_RENDER_ORIGIN
  const t = await tags(res);
  expect(t.ogImage).toBe(DEFAULT_OG_IMAGE); // unchanged static default from SHELL_HTML
  expect(t.ogImageAlt).toBe(DEFAULT_ALT);
  expect(t.twitterImageAlt).toBe(DEFAULT_ALT);
  // Title tags still rewrite — those are pass-1 behavior, ungated by the origin.
  expect(t.ogTitle).toBe("My Scene");
});
