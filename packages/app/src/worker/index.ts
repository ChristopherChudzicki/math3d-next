/**
 * OG metadata Worker (pass 1: per-scene text).
 *
 * Fronts the Static-Assets deployment. For a single-segment scene-key
 * navigation it looks up the scene title via the read-only
 * `GET /scenes/{key}/meta/` endpoint and rewrites a fixed set of <head> tags in
 * the SPA shell via HTMLRewriter. Every other request passes straight through
 * to env.ASSETS untouched. The SPA never reads anything this injects — it's
 * crawler-facing metadata only (abandonability invariant).
 *
 * Design: docs/superpowers/specs/2026-07-11-og-metadata-worker-design.md
 */
interface Env {
  ASSETS: Fetcher;
  API_BASE: string;
  SITE_ORIGIN: string;
}

/** Superset of the real key charset; cheap defense-in-depth before any backend touch. */
const KEY_RE = /^[A-Za-z0-9_-]{2,80}$/;
const META_TIMEOUT_MS = 800;
const TITLE_MAX_CODEPOINTS = 200;

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
 * are forwarded to the public endpoint.
 */
const fetchTitle = async (env: Env, key: string): Promise<string | null> => {
  try {
    const res = await fetch(`${env.API_BASE}/scenes/${key}/meta/`, {
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

/** Clamp to a code-point boundary so a surrogate pair / emoji isn't split. */
const clampCodePoints = (value: string, max: number): string => {
  const cps = Array.from(value);
  return cps.length <= max ? value : cps.slice(0, max).join("");
};

/** Trim + clamp; empty or the literal "Untitled" collapses to a generic name. */
const displayName = (raw: string): string => {
  const name = clampCodePoints(raw.trim(), TITLE_MAX_CODEPOINTS);
  return name === "" || name === "Untitled" ? "Untitled scene" : name;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const key = sceneKeyFromPath(new URL(request.url).pathname);
    if (key === null) return env.ASSETS.fetch(request);

    const rawTitle = await fetchTitle(env, key);
    if (rawTitle === null) return env.ASSETS.fetch(request); // graceful default

    const name = displayName(rawTitle);
    const tabTitle = `${name} | Math3d`;
    const ogUrl = `${env.SITE_ORIGIN}/${key}`;

    const shell = await env.ASSETS.fetch(request);
    // The title is user-controlled: inject it ONLY via HTMLRewriter's escaping
    // setters (setInnerContent {html:false} / setAttribute) — never concatenate
    // it into raw HTML. All state here is request-local (no module globals).
    const rewritten = new HTMLRewriter()
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
      .on('meta[property="og:url"]', {
        element(el) {
          el.setAttribute("content", ogUrl);
        },
      })
      .transform(shell);

    // Don't let an intermediary over-cache this per-scene HTML (the shell's own
    // Cache-Control would otherwise carry through).
    const response = new Response(rewritten.body, rewritten);
    response.headers.set(
      "Cache-Control",
      "private, max-age=0, must-revalidate",
    );
    return response;
  },
};
