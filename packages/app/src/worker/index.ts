/**
 * OG metadata Worker (pass 1: per-scene text; pass 2: per-scene image).
 *
 * Fronts the Static-Assets deployment. For a single-segment scene-key
 * navigation it looks up the scene title via the read-only
 * `GET /scenes/{key}/meta/` endpoint and rewrites a fixed set of <head> tags in
 * the SPA shell via HTMLRewriter. It also rewrites og:image/twitter:image
 * (plus their alt text) to point at a per-scene render, gated on the
 * OG_RENDER_ORIGIN env var — unset, the shell's static default card is left
 * untouched. Every other request passes straight through to env.ASSETS
 * untouched. The SPA never reads anything this injects — it's crawler-facing
 * metadata only (abandonability invariant).
 *
 * Design: docs/superpowers/specs/2026-07-11-og-metadata-worker-design.md
 */
import { sceneDisplayName } from "../features/scene/sceneTitle";

interface Env {
  ASSETS: Fetcher;
  API_BASE: string;
  SITE_ORIGIN: string;
  /** Origin of the dedicated render Worker. Unset → no per-scene og:image
   * rewrite (static default card). This var is the entire abandon switch. */
  OG_RENDER_ORIGIN?: string;
}

/** Superset of the real key charset; cheap defense-in-depth before any backend touch. */
const KEY_RE = /^[A-Za-z0-9_-]{2,80}$/;
const META_TIMEOUT_MS = 800;

/** A single non-asset path segment that could be a scene key, else null. */
const sceneKeyFromPath = (pathname: string): string | null => {
  const seg = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (seg === "" || seg.includes("/") || seg.includes(".") || seg === "app") {
    return null;
  }
  return KEY_RE.test(seg) ? seg : null;
};

/**
 * Read-only title lookup. Returns the title string (possibly "") on a valid
 * 200, or null on any failure — non-2xx, malformed body, missing/non-string
 * title, timeout, or network error. The caller treats null as "passthrough
 * defaults": the page must never block or error on this lookup.
 *
 * Uses a bare URL string (not the incoming request), so no cookies or headers
 * are forwarded to the public endpoint. API_BASE is the bare API origin; the
 * ninja API is mounted under /v1 (matching the generated client's paths).
 */
const fetchTitle = async (env: Env, key: string): Promise<string | null> => {
  try {
    const res = await fetch(`${env.API_BASE}/v1/scenes/${key}/meta/`, {
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { title?: unknown }).title === "string"
    ) {
      return (body as { title: string }).title;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Rewrite the shell's crawler-facing <head> tags for a scene. og:url is always
 * set to the scene's canonical URL. The <title>/og:title/twitter:title are
 * rewritten only for a *titled* scene; an untitled scene (blank or the literal
 * default "Untitled") keeps the shell's static rich defaults — matching the
 * home page and the SPA's own client-side title.
 *
 * The title is user-controlled: inject it ONLY via HTMLRewriter's escaping
 * setters (setInnerContent {html:false} / setAttribute) — never concatenate it
 * into raw HTML. All state here is request-local (no module globals).
 */
const rewriteShell = (
  shell: Response,
  rawTitle: string,
  key: string,
  env: Env,
): Response => {
  const ogUrl = `${env.SITE_ORIGIN}/${key}`;
  let rewriter = new HTMLRewriter().on('meta[property="og:url"]', {
    element(el) {
      el.setAttribute("content", ogUrl);
    },
  });

  // Per-scene image, gated on the render Worker's origin being configured.
  // Runs for every scene key (titled or untitled — untitled scenes still have
  // geometry to render). Unset OG_RENDER_ORIGIN → no rewrite at all, i.e. the
  // static default card from the shell.
  if (env.OG_RENDER_ORIGIN) {
    const imageUrl = `${env.OG_RENDER_ORIGIN}/og/scene/${key}.png`;
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
  }

  const name = sceneDisplayName(rawTitle);
  if (name !== null) {
    const tabTitle = `${name} | Math3d`;
    rewriter = rewriter
      .on("title", {
        element(el) {
          el.setInnerContent(tabTitle, { html: false });
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
      })
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

  const rewritten = rewriter.transform(shell);
  return new Response(rewritten.body, rewritten);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const key = sceneKeyFromPath(new URL(request.url).pathname);
    if (key === null) return env.ASSETS.fetch(request);

    // Scene-key path: fetch the shell and the title in parallel so the lookup
    // never adds its full latency on top of the shell fetch.
    const [shell, rawTitle] = await Promise.all([
      env.ASSETS.fetch(request),
      fetchTitle(env, key),
    ]);

    const response =
      rawTitle === null
        ? new Response(shell.body, shell) // fail-open: serve the default shell
        : rewriteShell(shell, rawTitle, key, env);

    // Anything served under a scene URL — a rewrite or a transient fail-open
    // shell — is per-scene and must not be cached by shared intermediaries.
    // (The real passthrough above keeps the asset's own caching.)
    response.headers.set(
      "Cache-Control",
      "private, max-age=0, must-revalidate",
    );
    return response;
  },
};
