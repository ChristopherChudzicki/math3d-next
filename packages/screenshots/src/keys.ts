import type { Env } from "./env";

/**
 * Superset of the real key charset — the same regex the pass-1 app Worker uses
 * (packages/app/src/worker/index.ts). Copied deliberately to keep this package
 * dependency-free and independently abandonable; the charset is stable. Cheap
 * defense-in-depth before building any URL or navigating a browser.
 */
export const KEY_RE = /^[A-Za-z0-9_-]{2,80}$/;

export const sceneImageKey = (key: string): string =>
  `screenshots/scene/${key}.png`;

/** Parse "/screenshots/scene/{key}.png" → validated key, else null. */
export const sceneImagePathToKey = (pathname: string): string | null => {
  const m = /^\/screenshots\/scene\/([^/]+)\.png$/.exec(pathname);
  if (m === null) return null;
  const key = m[1];
  return KEY_RE.test(key) ? key : null;
};

export const sceneFrameUrl = (env: Env, key: string): string =>
  `${env.FRAME_ORIGIN}/app/frame/${key}`;
