/**
 * Use.GPU is alpha and renames things between minors, so every package is
 * pinned to one version (root `resolutions`). `@use-gpu/workbench` also
 * carries a Yarn patch, which a bump has to regenerate:
 * `yarn patch @use-gpu/workbench@npm:<version>`, redo the edit in
 * `dual-contour-layer` (cjs, mjs, and both .d.ts files), `yarn patch-commit -s
 * <folder>`, then keep the root resolution keyed by bare name, so it also
 * covers Use.GPU's own requests, and point packages/app's dependency at the
 * new patch file.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const repoRoot = (() => {
  let dir = import.meta.dirname;
  while (!existsSync(path.join(dir, "yarn.lock"))) dir = path.dirname(dir);
  return dir;
})();

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

test("every @use-gpu package in yarn.lock resolves to one version", () => {
  const lock = readFileSync(path.join(repoRoot, "yarn.lock"), "utf8");
  const versions = [
    ...lock.matchAll(/^"(@use-gpu\/[^@]+)@[^\n]*\n {2}version: (\S+)/gm),
  ].map(([, name, version]) => ({ name, version }));
  expect(versions.length).toBeGreaterThan(0);
  expect(new Set(versions.map((v) => v.version)).size).toBe(1);
});

// Packages that depend on workbench: the app and some of Use.GPU's own.
const workbenchConsumers = [
  "packages/app",
  ...readdirSync(path.join(repoRoot, "node_modules/@use-gpu"))
    .map((name) => `node_modules/@use-gpu/${name}`)
    .filter(
      (dir) =>
        "@use-gpu/workbench" in
        (readJson(path.join(repoRoot, dir, "package.json")).dependencies ?? {}),
    ),
];

test.each(workbenchConsumers)(
  "%s loads the patched workbench, which passes depthTest and depthWrite to DualContourLayer",
  (consumer) => {
    const require = createRequire(
      path.join(repoRoot, consumer, "package.json"),
    );
    const workbench = path.dirname(
      require.resolve("@use-gpu/workbench/package.json"),
    );
    const source = readFileSync(
      path.join(workbench, "mjs/layers/dual-contour-layer.mjs"),
      "utf8",
    );
    expect(source).toMatch(
      /blend, depthTest, depthWrite, transform \} = props/,
    );
  },
);
