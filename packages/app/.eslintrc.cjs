// ESLint replaces, rather than merges, a rule redefined here, so extend
// airbnb's restricted-syntax list instead of dropping it.
const {
  rules: {
    "no-restricted-syntax": [, ...airbnbRestrictedSyntax],
  },
} = require("eslint-config-airbnb-base/rules/style");

module.exports = {
  // ESLint skips dot-directories unless un-ignored.
  ignorePatterns: ["!.storybook"],
  rules: {
    // src/ui holds generic components that know nothing about the app.
    "import/no-restricted-paths": [
      "error",
      {
        basePath: __dirname,
        zones: [
          {
            target: "./src/ui",
            from: [
              "./src/features",
              "./src/pages",
              "./src/store",
              "./src/services",
              "./src/worker",
              "./src/routes.tsx",
              "./src/AppProviders.tsx",
            ],
            message: "src/ui must not depend on app code.",
          },
        ],
      },
    ],
    // Base UI is wrapped by components in src/ui; everything else uses those.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@base-ui/react", "@base-ui/react/*"],
            message: "Use a component from src/ui instead of Base UI directly.",
          },
        ],
      },
    ],
    // A string icon ref ("lucide:x") makes Iconify fetch the icon at runtime;
    // import the icon data instead so it is bundled.
    "no-restricted-syntax": [
      "error",
      ...airbnbRestrictedSyntax,
      {
        selector:
          "JSXOpeningElement[name.name='Icon'] > JSXAttribute[name.name='icon'] > Literal",
        message:
          'Import the icon, e.g. `import x from "@iconify-icons/lucide/x"`.',
      },
    ],
  },
  overrides: [
    {
      files: ["src/ui/**"],
      rules: { "no-restricted-imports": "off" },
    },
    // The edge Worker (src/worker) is typechecked with Workers types via its
    // own tsconfig, excluded from the app's main tsconfig. Point ESLint's
    // typed-linting parser at that project so worker sources lint under the
    // same rules.
    {
      files: ["src/worker/**/*.ts"],
      parserOptions: {
        project: "./src/worker/tsconfig.json",
      },
    },
  ],
};
