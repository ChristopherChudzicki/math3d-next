// Nothing depends on this package: it is private, and every file is Playwright
// spec code or a helper for it. The shared allowlist keys on `*.spec.ts`; these
// specs are `*.test.ts`, so a glob set here would just re-spell the package.
module.exports = {
  rules: {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@playwright/test",
            importNames: ["test"],
            message:
              "Import `test` from @/fixtures/users, which fails a test on any Content-Security-Policy violation.",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: [
        "src/fixtures/users.ts",
        "src/global.setup.ts",
        "src/**/*.unit.ts",
      ],
      rules: { "no-restricted-imports": "off" },
    },
  ],
};
