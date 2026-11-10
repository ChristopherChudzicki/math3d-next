# 0008 — Use.GPU as an opt-in second renderer

**Status:** Proposed

## Context

The viewport renders with [MathBox](https://github.com/unconed/mathbox), a
WebGL library. [Use.GPU](https://usegpu.live) is its author's WebGPU
successor: it is alpha, renames things between minors, and needs a browser
with a WebGPU adapter.

## Decision

**Add Use.GPU as a second, opt-in renderer. MathBox stays the default.**

- `services/renderer/` picks the viewport: an explicit `?renderer` (`mathbox`
  or `usegpu`) wins over a per-browser preference set from the account menu.
- Without a WebGPU adapter (detection gives up after 2 s), MathBox draws, with
  a notice when the URL asked for Use.GPU. A device that fails to start also
  falls back to MathBox, with a notice, and stores `mathbox` as the preference.
- `FramePage` stays MathBox-only: Cloudflare Browser Run, which renders OG
  images, has no WebGPU adapter.

### Folders and lint zones

[ADR-0009](0009-renderer-neutral-viewport-spec.md) records the
`features/viewport/` folders, their lint zones, and the
`@math3d/viewport-spec` types Use.GPU draws from.

### The lazy boundary

- `usegpu/GpuViewport` loads `usegpu/live/GpuViewportContent` through one
  `React.lazy`. The main bundle carries none of Use.GPU.
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

- `DualContourLayer` passes `depthTest`/`depthWrite` through. It hardcodes
  both to `true`, so a translucent implicit surface self-occludes into speckle.
- `OITBuffer`'s `OIT/Transparency` target gets `colorInput: 'linear'`.
  Otherwise order-independent-transparency draws are linearized and never
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
  `?renderer=mathbox` and one with `?renderer=usegpu` (a stored preference
  would otherwise put both on Use.GPU).

## Consequences

- **Exit criteria.** Remove the Use.GPU renderer if Use.GPU goes 12 months
  without a release, or if two minors in a row need breaking changes on our
  side.
- **Upgrade checklist:**
  - bump every `@use-gpu/*` package together (Renovate groups them, on
    dashboard approval);
  - regenerate the workbench patch (steps in `usegpu/pins.spec.ts`), dropping
    any hunk the release fixed, and run `usegpu/pins.spec.ts`;
  - if `OrbitControls` gains touch gestures, delete `usePinchZoom`;
  - open each QA scene in two tabs, `?renderer=mathbox` and `?renderer=usegpu`;
  - read the release's deprecation list.
- E2E: `viewport/usegpu-renderer.test.ts` stubs a null adapter and checks
  `?renderer=usegpu` draws MathBox with the notice, never loading the lazy
  chunk; `viewport/usegpu-drawing.test.ts` gets an adapter from SwiftShader
  flags and checks Use.GPU draws: colored pixels in the viewport, and no
  console errors, where Use.GPU reports WGSL and validation errors.

## Alternatives considered

- **Replace MathBox outright.** Use.GPU is alpha and WebGPU is not in every
  browser; an opt-in keeps MathBox the default while parity is built.
