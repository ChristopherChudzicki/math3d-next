# 0008 — Use.GPU as an opt-in second renderer

**Status:** Proposed

## Context

The viewport renders with [MathBox](https://github.com/unconed/mathbox), a
WebGL library. [Use.GPU](https://usegpu.live) is its author's WebGPU
successor: it is alpha, renames things between minors, and needs a browser
with a WebGPU adapter.

## Decision

**Add Use.GPU as a second renderer behind `?renderer=usegpu`. MathBox stays
the default and is unchanged.**

- `MainPage` picks the viewport from `?renderer`; without it, nothing about
  the MathBox path changes.
- Without `navigator.gpu` (or with no adapter), the Use.GPU viewport says
  WebGPU is unavailable and links back to the default renderer.

### Folders and lint zones

`features/viewport/` holds three folders, with zones written by hand in
`packages/app/.eslintrc.cjs`:

- **`shared/`** serves both renderers and imports neither.
- **`mathbox/`** and **`usegpu/`** don't import each other; common code moves
  to `shared/`.
- **`usegpu/live/`** is the only code that imports Use.GPU's runtime
  (`@use-gpu/*` except `@use-gpu/core`, enforced by `no-restricted-imports`).
  Only `usegpu/GpuViewport` reaches it.
- **`usegpu/graphicSpec/`** reads the store and MathScope and produces specs.
  **A spec field is in math-item terms only** (evaluated positions, RGBA
  colors, sample callbacks), never a Use.GPU prop, so the specs are testable
  under jsdom and survive a Use.GPU rename.

### The lazy boundary

- `usegpu/GpuViewport` loads `usegpu/live/GpuViewportContent` through one
  `React.lazy`, and only when `navigator.gpu` exists. The main bundle carries
  none of Use.GPU.
- **Why:** `@use-gpu/wgsl@0.21.0` ships CommonJS `.js` files inside a
  `"type": "module"` package, which Vitest's jsdom run can't import. The
  boundary keeps the runtime out of every jsdom test.
- **Revisit** when Use.GPU publishes `wgsl` with correct module packaging, or
  if jsdom tests need to render `live/`.
- `@use-gpu/glyph` imports its rasterizer as an ESM `.wasm` module, so Vite
  loads `vite-plugin-wasm`.

### The Yarn patch

`.yarn/patches/@use-gpu-workbench-npm-0.21.0-2d614b987d.patch` fixes two
upstream bugs:

- **`DualContourLayer` passes `depthTest`/`depthWrite` through.** It hardcodes
  both to `true`, so a translucent implicit surface self-occludes into speckle.
- **`OITBuffer`'s `OIT/Transparency` target gets `colorInput: 'linear'`.**
  Otherwise order-independent-transparency draws are linearised and never
  converted back, darkening mid-tone translucent colors by a 2.2 gamma.

**Remove a hunk** when a Use.GPU release contains its fix.
`usegpu/pins.spec.ts` fails if the pins drift or either hunk is missing.

### Parity record

- `shared/coverage.ts` types a table that classifies every stored property of
  every rendered item; `mathbox/coverage.ts` and `usegpu/coverage.ts` fill it.
  A new property fails typecheck until both renderers classify it.
- An `approximate: <why>` entry is a known difference from MathBox; `n/a:` is
  a property that doesn't apply; `todo` is a gap.
- QA scenes (`webserver/scenes/seed_scenes/qa/`, one per graphical feature)
  are compared by hand: the same key in two tabs, one with
  `?renderer=usegpu`. No Playwright-launched Chromium on macOS exposes a WebGPU
  adapter, so there is no automated comparison.

## Consequences

- **Exit criteria.** Remove the Use.GPU renderer if Use.GPU goes 12 months
  without a release, or if two minors in a row need breaking changes on our
  side.
- **Upgrade checklist:**
  - bump every `@use-gpu/*` package together (Renovate groups them, on
    dashboard approval);
  - regenerate the workbench patch (steps in `usegpu/pins.spec.ts`), dropping
    any hunk the release fixed, and run the canary;
  - open each QA scene in two tabs, one per renderer;
  - read the release's deprecation list.
- The E2E smoke test (`viewport/usegpu-renderer.test.ts`) checks only that the
  route loads without page errors: a canvas with a WebGPU adapter, the
  unavailable message without.

## Alternatives considered

- **Replace MathBox outright.** Use.GPU is alpha and WebGPU is not in every
  browser; an opt-in keeps the default path untouched while parity is built.
