/**
 * Shared scene-title formatting used by BOTH the browser SPA
 * (`useSceneLoader`) and the edge OG Worker (`src/worker`). Keep it
 * dependency-free and DOM/Worker-agnostic so it typechecks under both the app's
 * DOM lib and the Worker's `@cloudflare/workers-types` lib, and so the two
 * surfaces can never drift (a deep-linked scene must show the same tab title
 * before and after app boot).
 *
 * A scene left at the DB default `"Untitled"` (or blank) is treated as
 * untitled: it reads like the home page — the site's rich default title —
 * rather than carrying a scene-specific tab/card title.
 */

export const TITLE_MAX_CODEPOINTS = 200;

/** Clamp on a code-point boundary so an emoji / surrogate pair isn't split. */
const clampCodePoints = (value: string, max: number): string => {
  const cps = Array.from(value);
  return cps.length <= max ? value : cps.slice(0, max).join("");
};

/**
 * The scene's display name (trimmed, code-point-clamped), or `null` when the
 * scene is effectively untitled — blank/whitespace or the literal default
 * `"Untitled"`. Callers substitute the site's rich default title for `null`.
 */
export const sceneDisplayName = (rawTitle: string): string | null => {
  const name = clampCodePoints(rawTitle.trim(), TITLE_MAX_CODEPOINTS);
  return name === "" || name === "Untitled" ? null : name;
};

/**
 * The browser tab / `<title>` text for a scene: `"{name} | Math3d"`, or the
 * provided site default when the scene is untitled.
 */
export const sceneTabTitle = (
  rawTitle: string,
  siteDefault: string,
): string => {
  const name = sceneDisplayName(rawTitle);
  return name === null ? siteDefault : `${name} | Math3d`;
};
