/**
 * Use.GPU is alpha and renames things between minors, so every package is
 * pinned to one version (root `resolutions`). `@use-gpu/workbench` also
 * carries a Yarn patch. These tests fail when yarn.lock holds two versions or
 * the patch is missing.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = (() => {
  let dir = import.meta.dirname;
  while (!existsSync(path.join(dir, "yarn.lock"))) dir = path.dirname(dir);
  return dir;
})();

test("every @use-gpu package in yarn.lock resolves to one version", () => {
  const lock = readFileSync(path.join(repoRoot, "yarn.lock"), "utf8");
  const versions = [
    ...lock.matchAll(/^"(@use-gpu\/[^@]+)@[^\n]*\n {2}version: (\S+)/gm),
  ].map(([, name, version]) => ({ name, version }));
  expect(versions.length).toBeGreaterThan(0);
  expect(new Set(versions.map((v) => v.version)).size).toBe(1);
});

test("the workbench patch passes depthTest and depthWrite to DualContourLayer", () => {
  const source = readFileSync(
    path.join(
      repoRoot,
      "node_modules/@use-gpu/workbench/mjs/layers/dual-contour-layer.mjs",
    ),
    "utf8",
  );
  expect(source).toMatch(/blend, depthTest, depthWrite, transform \} = props/);
});
