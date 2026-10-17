const fs = require("fs");
const path = require("path");

// The online @iconify/react fetches icons named by string ("lucide:x") at
// runtime; the offline build only renders imported icon data.
const iconifyOnline = {
  name: "@iconify/react",
  message: 'Import from "@iconify/react/offline".',
};

// The app is built on Base UI + CSS Modules (docs/adr/0006).
const noMui = {
  group: ["@mui/*", "@emotion/*"],
  message: "MUI and Emotion are not dependencies; build on Base UI via src/ui.",
};

// Base UI is wrapped by components in src/ui; everything else uses those.
const baseUi = {
  group: ["@base-ui/react", "@base-ui/react/*"],
  message: "Use a component from src/ui instead of Base UI directly.",
};

// Layout tiers (docs/adr/0007): shared -> features -> app, one-way.
const SHARED = ["ui", "util", "services", "store", "config", "types"].map(
  (dir) => `./src/${dir}`,
);
const GENERIC_SHARED = ["ui", "util", "services", "config", "types"].map(
  (dir) => `./src/${dir}`,
);
const features = fs
  .readdirSync(path.join(__dirname, "src/features"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Imports leaving a module's own folder use @/ paths (Bulletproof's "absolute
// imports"). The Worker is exempt: its tsconfig has no @/ alias.
const noParentImports = {
  group: [".."],
  message: "Import from outside this folder with an @/ path.",
};

const layoutZones = [
  ...features.map((feature) => ({
    target: `./src/features/${feature}`,
    from: "./src/features",
    except: [`./${feature}`],
    message:
      "Features don't import each other; compose them in src/app (docs/adr/0007).",
  })),
  {
    target: "./src/features",
    from: "./src/app",
    message: "Features don't import the app tier (docs/adr/0007).",
  },
  {
    target: SHARED,
    from: ["./src/features", "./src/app"],
    message: "Shared code doesn't import features or the app tier.",
  },
  {
    target: "./src/ui",
    from: ["./src/store", "./src/services", "./src/config", "./src/worker"],
    message: "src/ui holds generic components that know nothing about the app.",
  },
  {
    target: "./src/store/scene",
    from: "./src/ui",
    message: "The scene model is headless.",
  },
  {
    target: GENERIC_SHARED,
    from: "./src/store/scene",
    message: "Generic shared code doesn't depend on the scene model.",
  },
  {
    target: "./src/store/scene/state",
    from: "./src/store/scene/evaluation",
    message: "Evaluation builds on scene state, not the reverse.",
  },
  {
    target: "./src/worker",
    from: "./src",
    except: ["./worker", "./store/scene/sceneTitle.ts"],
    message:
      "The edge Worker runs in workerd; it imports only sceneTitle from the app.",
  },
];

module.exports = {
  // ESLint skips dot-directories unless un-ignored.
  ignorePatterns: ["!.storybook"],
  rules: {
    "import/no-restricted-paths": [
      "error",
      { basePath: __dirname, zones: layoutZones },
    ],
    "no-restricted-imports": [
      "error",
      { paths: [iconifyOnline], patterns: [baseUi, noMui] },
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
      files: ["src/**"],
      excludedFiles: ["src/worker/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [iconifyOnline],
            patterns: [baseUi, noMui, noParentImports],
          },
        ],
      },
    },
    {
      files: ["src/ui/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          { paths: [iconifyOnline], patterns: [noMui, noParentImports] },
        ],
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
