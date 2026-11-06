import { existsSync } from "node:fs";
import path from "node:path";

/** The monorepo root: the nearest ancestor of this file holding `yarn.lock`. */
export const repoRoot = (() => {
  let dir = import.meta.dirname;
  while (!existsSync(path.join(dir, "yarn.lock"))) dir = path.dirname(dir);
  return dir;
})();
