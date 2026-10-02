// The online @iconify/react fetches icons named by string ("lucide:x") at
// runtime; the offline build only renders imported icon data.
const iconifyOnline = {
  name: "@iconify/react",
  message: 'Import from "@iconify/react/offline".',
};

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
    "no-restricted-imports": [
      "error",
      {
        paths: [iconifyOnline],
        // Base UI is wrapped by components in src/ui; everything else uses
        // those.
        patterns: [
          {
            group: ["@base-ui/react", "@base-ui/react/*"],
            message: "Use a component from src/ui instead of Base UI directly.",
          },
        ],
      },
    ],
    // Safari drops a <ul>'s list semantics under `list-style: none` unless
    // role="list" is explicit. nav/navigation is the rule's own default.
    "jsx-a11y/no-redundant-roles": [
      "error",
      { nav: ["navigation"], ul: ["list"] },
    ],
  },
  overrides: [
    {
      files: ["src/ui/**"],
      rules: {
        "no-restricted-imports": ["error", { paths: [iconifyOnline] }],
      },
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
