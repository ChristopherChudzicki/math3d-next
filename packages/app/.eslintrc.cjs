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

// Use.GPU's runtime stays behind the one React.lazy in usegpu/GpuViewport, so
// it never reaches the main bundle or jsdom tests (@use-gpu/wgsl's CommonJS
// build is .js in a "type": "module" package). @use-gpu/core loads under jsdom.
const useGpuRuntime = {
  group: ["@use-gpu/*", "!@use-gpu/core"],
  message: "Use.GPU's runtime loads only through usegpu/live (React.lazy).",
};

// The path zones below keep renderer folders out of spec/ and shared/; this
// keeps renderer packages out (docs/adr/0009).
const noRendererPackages = {
  group: ["three", "three/*", "mathbox*", "@use-gpu/*"],
  message:
    "viewport/spec and viewport/shared are renderer-neutral; renderer code goes in its own folder.",
};

// ESLint overrides replace a rule's options rather than merging them, so every
// override builds its pattern list here.
const restrictedImports = ({
  allowBaseUi = false,
  allowParentImports = false,
  allowUseGpu = false,
  rendererNeutral = false,
} = {}) => ({
  paths: [iconifyOnline],
  patterns: [
    ...(allowBaseUi ? [] : [baseUi]),
    noMui,
    ...(allowParentImports ? [] : [noParentImports]),
    ...(allowUseGpu ? [] : [useGpuRuntime]),
    ...(rendererNeutral ? [noRendererPackages] : []),
  ],
});

const VIEWPORT = "./src/features/viewport";

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
  {
    target: `${VIEWPORT}/mathbox`,
    from: `${VIEWPORT}/usegpu`,
    message:
      "The renderers don't import each other; share code via shared/ or spec/.",
  },
  {
    target: `${VIEWPORT}/usegpu`,
    from: `${VIEWPORT}/mathbox`,
    message:
      "The renderers don't import each other; share code via shared/ or spec/.",
  },
  {
    target: `${VIEWPORT}/shared`,
    from: VIEWPORT,
    except: ["./shared"],
    message:
      "viewport/shared is imported by the renderers and spec/; it imports none of them.",
  },
  {
    target: `${VIEWPORT}/spec`,
    from: VIEWPORT,
    except: ["./spec", "./shared"],
    message:
      "viewport/spec produces renderer-neutral specs and imports no renderer.",
  },
  {
    // mathbox/, shared/, spec/ and other features are covered by the zones above.
    target: [
      "./src/app",
      `${VIEWPORT}/*.{ts,tsx}`,
      `${VIEWPORT}/usegpu/!(live)/**`,
      `${VIEWPORT}/usegpu/*.{ts,tsx}`,
    ],
    from: `${VIEWPORT}/usegpu/live`,
    message:
      "Only usegpu/GpuViewport reaches usegpu/live, through its React.lazy.",
  },
  {
    target: "./src",
    from: "./vite-plugins",
    message: "vite-plugins is build-time Node code; the app never imports it.",
  },
  {
    target: "./vite-plugins",
    from: "./src",
    except: ["./app/pages/HelpPage/groups.ts", "./app/pages/HelpPage/types.ts"],
    message: "Build-time plugins import only the Help doc groups and types.",
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
      restrictedImports({ allowParentImports: true }),
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
        "no-restricted-imports": ["error", restrictedImports()],
      },
    },
    {
      files: ["src/ui/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          restrictedImports({ allowBaseUi: true }),
        ],
      },
    },
    {
      files: [
        "src/features/viewport/spec/**",
        "src/features/viewport/shared/**",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          restrictedImports({ rendererNeutral: true }),
        ],
      },
    },
    {
      files: ["src/features/viewport/usegpu/live/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          restrictedImports({ allowUseGpu: true }),
        ],
      },
    },
    // test_util renders the whole app, so production code importing it would
    // reach src/app (and ship test helpers) without crossing a zone.
    {
      files: ["src/**"],
      excludedFiles: [
        "**/*.spec.ts?(x)",
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/*.stories.tsx",
        "src/test_util/**",
        "src/setupTests.ts",
      ],
      rules: {
        "import/no-restricted-paths": [
          "error",
          {
            basePath: __dirname,
            zones: [
              ...layoutZones,
              {
                target: "./src",
                from: "./src/test_util",
                message: "test_util is for tests.",
              },
            ],
          },
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
