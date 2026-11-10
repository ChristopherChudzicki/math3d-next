# 0009 — A renderer-neutral viewport contract

**Status:** Proposed

## Context

MathBox reads math items from the store inside its own React tree. Use.GPU
([ADR-0008](0008-usegpu-opt-in-renderer.md)) can't: its scene is a Live tree,
outside React's context. The three.js renderer is its own workspace, with a
different `three` than `mathbox-react` allows, and so can't import `app` at
all. Both need the scene as plain data.

## Decision

**A renderer that can't read the store draws from a `ViewportSpec` and
reports back through `ViewportHooks`, both types in
`@math3d/viewport-spec`.**

- `@math3d/viewport-spec` holds types only (`ViewportSpec`, `ViewportHooks`,
  `GraphicSpec`, `CameraSpec`, `RGBA`, `Coords`, `AxesRange`): no runtime
  dependencies on `app`, React or any renderer.
- `ViewportSpec` is the axes' `range` and `scale`, the `camera` (a
  `CameraSpec` in view coordinates), an `orthographic` flag, the enabled
  `controls`, and the `graphics` as an ordered `{ id, spec }` list.
- `ViewportHooks`: `onUnsupported(error)` when the renderer can't run in this
  browser; `onCameraMove(camera)` as the user moves the camera (the app
  decides when a move ends and what to write back); `onReady()` once the
  first frame is drawn (the three.js glue sets `data-ready` for E2E).
- `features/viewport/spec/` produces it: `useViewportSpec` returns the spec,
  the reporter elements that fill `spec.graphics` (render them alongside the
  renderer), and the camera item for write-back.
- A renderer derives its own shapes from `ViewportSpec`: Use.GPU's
  `SceneSpec` replaces `camera` and `orthographic` with y-up orbit parameters
  and a dolly.
- Coverage tables live in `app`
  ([ADR-0008](0008-usegpu-opt-in-renderer.md#parity-record)).

### The renderer list

`services/renderer/renderers.ts` lists the renderers, keyed `mathbox`
(default), `usegpu` and `threejs`, each with its library name, menu label
and whether it needs WebGPU. The keys are the `?renderer=` values and the
stored preference; the account menu's "Renderer" radio group and
`RendererPill` read the list. The shared tier can't import viewports, so
`MainPage` maps each key to its viewport in a `Record<Renderer, …>`, which
fails typecheck until a new key has one.

### `@math3d/renderer-three`

The three.js renderer is the `packages/renderer-three` workspace, with its
own `three` and `@types/three` (Yarn nests them under the workspace; the
app's root copy is MathBox's `three@0.147`). It exports a React `Viewport`
taking a `ViewportSpec`, `ViewportHooks` and `forceWebGL`, and is built on
`WebGPURenderer` (`three/webgpu`), which falls back to WebGL2 by itself.

- A graphic kind plugs in as a builder in `graphics/builders.ts`;
  `syncGraphics` adds, updates and disposes graphics by `id`, and gives each
  its item's place in the list for breaking draw-order ties.
- `Viewport` rethrows what a frame or resize throws, so the error boundary
  sees it.
- Frames draw on change, but three's own animation-frame loop runs from the
  first frame until disposal.
- Its Vitest project runs in Node, so it tests pure code only.

`features/viewport/three/ThreeViewport` is the app's glue: it collects the
spec with `useViewportSpec` and loads the package through its one
`React.lazy`, so the second `three` ships only in that lazy chunk. It and
`usegpu/GpuViewport` render inside `shared/ViewportShell` (scene container,
error boundary, `Suspense`). A
`no-restricted-imports` group bans static imports of
`@math3d/renderer-three` everywhere in `app` (the rule doesn't check
`import()`). jsdom tests get a stand-in from `setupTests.ts`.

### Folders and lint zones

`features/viewport/` holds one folder per renderer plus `shared/` and `spec/`,
with zones written by hand in `packages/app/.eslintrc.cjs`:

- `shared/` is imported by the renderers and `spec/`; it imports none of
  them.
- `spec/` reads the store and MathScope and produces specs; it imports no
  renderer, and any renderer may import it. **A spec field is in math-item
  terms only** (evaluated positions, RGBA colors, sample callbacks), never a
  renderer prop, so the specs are testable under jsdom and survive a renderer
  swap.
- `spec/`, `shared/` and `three/` import no renderer package (`three`,
  `mathbox*`, `@use-gpu/*`; a `no-restricted-imports` group). The path
  zones above check folders only. In `app`, `three` is MathBox's copy, so
  three.js code goes in `@math3d/renderer-three`.
- The renderer folders (`mathbox/`, `usegpu/`, `three/`) don't import each
  other; common code moves to `shared/` or `spec/`.

## Consequences

- A new renderer draws from `useViewportSpec`'s output; what touches the
  store (camera write-back, fallback on `onUnsupported`) stays in its `app`
  glue. Adding one touches the renderer list, `MainPage`'s map and the lint
  zones.
- While MathBox stays, the app ships two copies of `three`: the main bundle
  carries `0.147` and the three.js chunk its own. three.js logs "Multiple
  instances of Three.js being imported" when that chunk loads.
- MathBox stays outside the contract while it reads math items directly.
- Nothing calls `onCameraMove` while Use.GPU's write-back
  (`usegpu/useOrbitWriteBack`) handles its own orbit parameters; splitting
  out its neutral half moves Use.GPU onto the hook.

## Alternatives considered

- **Each renderer reads the store itself.** Use.GPU and a separate-workspace
  three.js renderer can't, and the spec components would be duplicated per
  renderer.
- **Coverage tables in `@math3d/viewport-spec`.** They key on
  `mathitem-configs` types, which would give the package a dependency.
