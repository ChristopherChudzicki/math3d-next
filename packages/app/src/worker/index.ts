/**
 * OG metadata Worker (pass 1: per-scene text; pass 2: per-scene image).
 *
 * Runs for requests that match no static asset. For a single-segment scene-key
 * navigation it looks up the scene title via the read-only
 * `GET /scenes/{key}/meta/` endpoint and rewrites a fixed set of <head> tags in
 * the SPA shell via HTMLRewriter. The shell's canonical link and og:url name
 * the home page, so it points them at each page's own path, or removes them
 * where the page must not be indexed (a 404, frame, sign-in-error). It also
 * rewrites og:image/twitter:image (plus their alt text) to point at a
 * per-scene render, gated on the SCREENSHOTS_ORIGIN env var — unset, the
 * shell's static default card is left untouched. It is also the SPA
 * fallback: any other path gets the shell, with status 404 where the SPA
 * renders not-found (no route matches, an invalid key, or a key the API
 * doesn't know), and /assets/ misses get a plain 404. The SPA
 * never reads anything this injects — it's crawler-facing metadata only
 * (abandonability invariant). Dropping the Worker means setting
 * `not_found_handling` back to "single-page-application" and removing the
 * shell's canonical link, which would otherwise name home on every page.
 *
 * Design: docs/superpowers/specs/2026-07-11-og-metadata-worker-design.md
 */
import { HELP_REFERENCE_NAME } from "../config/pageTitle";
import { SCENE_KEY_PATTERN } from "../config/sceneKey";
import { sceneDisplayName, tabTitle } from "../store/scene/sceneTitle";
import { matchRoute, type RouteMatch } from "./routes";

interface Env {
  ASSETS: Fetcher;
  API_BASE: string;
  SITE_ORIGIN: string;
  /** Origin of the dedicated render Worker. Unset → no per-scene og:image
   * rewrite (static default card). This var is the entire abandon switch. */
  SCREENSHOTS_ORIGIN?: string;
}

const META_TIMEOUT_MS = 800;

/** django-ninja's JSON 404, which the meta endpoint sends for an unknown key.
 * Any other 404 (e.g. a wrong API_BASE) says nothing about the scene. */
const isNinjaNotFound = async (res: Response): Promise<boolean> => {
  if (res.status !== 404) return false;
  const body: unknown = await res.json().catch(() => null);
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { detail?: unknown }).detail === "string"
  );
};

/**
 * Read-only title lookup: the status a scene URL answers with, and the title to
 * rewrite the shell with, if any (possibly ""). 404 only when the endpoint says
 * the scene doesn't exist; any other failure — another status, a malformed
 * body, a timeout, a network error — is 200 with no title: the page must never
 * block, error or 404 on a lookup failure.
 *
 * Uses a bare URL string (not the incoming request), so no cookies or headers
 * are forwarded to the public endpoint. API_BASE is the bare API origin; the
 * ninja API is mounted under /v1 (matching the generated client's paths).
 */
const lookUp = async (
  env: Env,
  key: string,
): Promise<{ status: 200 | 404; title: string | null }> => {
  const failed = { status: 200, title: null } as const;
  try {
    const res = await fetch(`${env.API_BASE}/v1/scenes/${key}/meta/`, {
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    if (await isNinjaNotFound(res)) return { status: 404, title: null };
    if (!res.ok) return failed;
    const body: unknown = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { title?: unknown }).title === "string"
    ) {
      return { status: 200, title: (body as { title: string }).title };
    }
    return failed;
  } catch {
    return failed;
  }
};

/** Points the canonical link and og:url at `url`. */
const atUrl = (rewriter: HTMLRewriter, url: string): HTMLRewriter =>
  rewriter
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", url);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute("content", url);
      },
    });

/** Names the page `name`: its <title>, og:title and twitter:title. */
const named = (rewriter: HTMLRewriter, name: string): HTMLRewriter =>
  rewriter
    .on("title", {
      element(el) {
        el.setInnerContent(tabTitle(name), { html: false });
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute("content", name);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute("content", name);
      },
    });

/** Removes the canonical link and og:url, which name the home page. */
const withoutUrl = (shell: Response): Response =>
  new HTMLRewriter()
    .on('link[rel="canonical"], meta[property="og:url"]', {
      element(el) {
        el.remove();
      },
    })
    .transform(shell);

/**
 * Rewrite the shell's crawler-facing <head> tags for a scene. The canonical
 * link and og:url always name the scene, even when its title lookup failed.
 * The <title>/og:title/twitter:title are rewritten only for a *titled* scene;
 * an untitled (blank) scene keeps the shell's static rich defaults — matching
 * the home page and the SPA's own client-side title.
 *
 * The title is user-controlled: inject it ONLY via HTMLRewriter's escaping
 * setters (setInnerContent {html:false} / setAttribute) — never concatenate it
 * into raw HTML. All state here is request-local (no module globals).
 */
const rewriteShell = (
  shell: Response,
  rawTitle: string | null,
  key: string,
  env: Env,
): Response => {
  let rewriter = atUrl(new HTMLRewriter(), `${env.SITE_ORIGIN}/${key}`);
  if (rawTitle === null) return rewriter.transform(shell);

  const name = sceneDisplayName(rawTitle);

  // Per-scene image, gated on the render Worker's origin being configured.
  // The image itself runs for every scene key (titled or untitled — untitled
  // scenes still have geometry to render). The alt text describes that image,
  // so it is *also* gated on SCREENSHOTS_ORIGIN: with the var unset the shell's
  // static default card AND its matching default alt are both left untouched
  // (abandonability invariant — a titled scene must not get an alt describing
  // a per-scene image that was never substituted). A titled render-on scene
  // also gets a scene-specific alt; an untitled one keeps the shell default.
  if (env.SCREENSHOTS_ORIGIN) {
    // Normalize a trailing slash: this var is the one hand-typed step of the
    // rollout, and a stray slash yields `host//screenshots/scene/k.png`, which
    // the render Worker's `^/screenshots/scene/` matcher rejects — every scene
    // would serve the default forever with no render and no error anywhere
    // (finding 6).
    const renderOrigin = env.SCREENSHOTS_ORIGIN.replace(/\/+$/, "");
    const imageUrl = `${renderOrigin}/screenshots/scene/${key}.png`;
    rewriter = rewriter
      .on('meta[property="og:image"]', {
        element(el) {
          el.setAttribute("content", imageUrl);
        },
      })
      .on('meta[name="twitter:image"]', {
        element(el) {
          el.setAttribute("content", imageUrl);
        },
      });
    if (name !== null) {
      rewriter = rewriter
        .on('meta[property="og:image:alt"]', {
          element(el) {
            el.setAttribute("content", name);
          },
        })
        .on('meta[name="twitter:image:alt"]', {
          element(el) {
            el.setAttribute("content", name);
          },
        });
    }
  }

  if (name !== null) rewriter = named(rewriter, name);
  return rewriter.transform(shell);
};

/** `res` with `status` and without its ETag: a response built from the shell
 * inherits the shell's ETag, which doesn't validate the rewritten page. */
const withoutEtag = (res: Response, status = 200): Response => {
  const out = new Response(res.body, { status, headers: res.headers });
  out.headers.delete("ETag");
  return out;
};

/** `withoutEtag`, and kept out of shared caches. */
const asPrivate = (res: Response, status: number): Response => {
  const out = withoutEtag(res, status);
  out.headers.set("Cache-Control", "private, max-age=0, must-revalidate");
  return out;
};

type FixedPath = Exclude<RouteMatch["path"], "/{-$sceneKey}">;

/** Every route but a scene's. A new route fails typecheck here until it is
 * given a page, so a public one can't fall into noindex by default. */
const fixedPage = (path: FixedPath, shell: Response, env: Env): Response => {
  switch (path) {
    case "/app/help/reference":
      return withoutEtag(
        named(
          atUrl(new HTMLRewriter(), `${env.SITE_ORIGIN}${path}`),
          HELP_REFERENCE_NAME,
        ).transform(shell),
      );
    case "/app/frame/$sceneKey":
    case "/app/sign-in-error": {
      const page = withoutEtag(withoutUrl(shell));
      page.headers.set("X-Robots-Tag", "noindex");
      return page;
    }
    default: {
      const unhandled: never = path;
      throw new Error(`No page for ${unhandled as string}`);
    }
  }
};

export default {
  // Static Assets invokes the Worker only for requests that match no asset
  // (wrangler.jsonc), so every request here is a miss.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // A missing chunk must 404 uncacheably: the shell breaks the import, and
    // ASSETS's own 404 would get _headers' immutable /assets/* rule.
    if (url.pathname.startsWith("/assets/")) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    // Drops the client's conditional headers, so ASSETS can't 304 a 404 or a
    // rewritten page.
    const freshShell = () =>
      env.ASSETS.fetch(
        new Request(new URL("/", url), { method: request.method }),
      );

    const notFound = async () => asPrivate(withoutUrl(await freshShell()), 404);

    const route = matchRoute(url.pathname);
    if (route === null) return notFound();
    if (route.path !== "/{-$sceneKey}") {
      return fixedPage(route.path, await freshShell(), env);
    }
    const key = route.params.sceneKey;
    // The home page, by a path the asset lookup missed: the shell as is,
    // conditional headers included.
    if (key === undefined) {
      return env.ASSETS.fetch(new Request(new URL("/", url), request));
    }
    // {-$sceneKey}.tsx's params.parse renders not-found for these.
    if (!SCENE_KEY_PATTERN.test(key)) return notFound();

    // Fetch the shell and the title in parallel so the lookup never adds its
    // full latency on top of the shell fetch.
    const [page, { status, title }] = await Promise.all([
      freshShell(),
      lookUp(env, key),
    ]);
    return asPrivate(
      status === 404 ? withoutUrl(page) : rewriteShell(page, title, key, env),
      status,
    );
  },
};
