// Nothing depends on this package: it is private, and every file is Playwright
// spec code or a helper for it. The shared allowlist keys on `*.spec.ts`; these
// specs are `*.test.ts`, so a glob set here would just re-spell the package.
module.exports = {
  rules: {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
