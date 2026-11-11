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
  `CameraSpec` in view coordinates), a `cameraRevision`, an `orthographic`
  flag, the enabled `controls`, and the `graphics` as an ordered
  `{ id, spec }` list.
- `ViewportHooks`: `onUnsupported(error)` when the renderer can't run in this
  browser; `onCameraMove(camera)` as the user moves the camera (the app
  decides when a move ends and what to write back); `onReady()` once the
  first frame is drawn (the three.js glue sets `data-ready` for E2E).
- `features/viewport/spec/` produces it: `useViewportSpec(host)` returns the
  spec, the reporter elements that fill `spec.graphics` (render them
  alongside the renderer), and the `onCameraMove` hook.
- **A spec field is a true quantity**, drawn as given by every renderer. A
  factor that only reproduces how MathBox reads a stored value, such as its
  circle points' 1.2 × `size`, is applied once, by name, in the spec
  producer.

### The camera

- **`cameraRevision` is the one signal to move the view.** When it changes,
  a renderer moves the view to `camera`; otherwise it leaves the user's view
  alone, even when `camera` changes identity.
  - `spec/useCameraWriteBack` bumps it when the stored camera changes, when
    the axes' range or scale changes, and when a move that went somewhere
    ends with `updateOnDrag` off (the stored camera is then unchanged, so
    nothing else in the spec would change).
  - Why not a new `camera` object: snap-back would hinge on identity, which a
    value comparison or a spec copy silently loses, and the loss would show
    only in the rare scenes with `updateOnDrag` off.
- **Move-end timing and write-back are the app's.** A move ends 200 ms after
  the last pointer release or wheel on `host` with no pointer down; then the
  last `onCameraMove` is written to the camera item or, with `updateOnDrag`
  off, the view snaps back.
- **Orthographic keeps position + target.** It shows, at the target, what
  the 60° perspective view shows there: visible height
  2 × |position − target| × tan(30°). A renderer that zooms it by a factor
  (three.js's `OrbitControls` does) reports the zoom as distance, and nothing
  behind the stored position is clipped (MathBox gets this from its ×40
  dolly, Use.GPU from near = −far, three.js from a near plane far behind the
  camera).
- A renderer derives its own shapes from `ViewportSpec`: Use.GPU's
  `SceneSpec` replaces `camera` and `orthographic` with y-up orbit parameters
  and a dolly, and passes `cameraRevision` to its orbit controls as their
  `version`.
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
  `syncGraphics` adds, updates and disposes graphics by `id`. Each item's
  `Group` gets its place in the list as `renderOrder`, which three sorts on
  before its parts' own `renderOrder`; builders never see it.
- `Viewport` rethrows what a frame or resize throws, so the error boundary
  sees it.
- Frames draw on change, but three's own animation-frame loop runs from the
  first frame until disposal.
- The camera is `camera.ts`'s `ViewCamera`: three's `OrbitControls` (no
  damping, so redraws stop when the user does) on a `PerspectiveCamera` or a
  true `OrthographicCamera`.
- Its Vitest project runs in Node, so it tests pure code only.

#### Drawing marks

A graphic's `object` holds math coordinates under a non-uniformly scaled
parent, so anything sized in pixels is built in the shader, in view space:

- **Pixel sizes are MathBox's.** `shader/viewUnits.ts` gives the view units
  one CSS pixel spans at view depth 1 (MathBox's `worldUnit`). A width or
  arrowhead is that size in view space: exact at one view unit from the camera,
  smaller farther away in perspective, and the same in orthographic as in the
  perspective view it replaces.
- **Every stroke is a `Stroke`** (`stroke/Stroke.ts`), a port of MathBox's
  line and arrow shaders: lines, vectors, curves, vector fields and surface
  gridlines, and the axes, ticks and grids still to come.
- **Every triangle mesh is a `TriangleMesh`** (`mesh/TriangleMesh.ts`), drawn
  with a port of MathBox's surface shading, gamma step included. It takes
  per-vertex RGBA, and normals in its own coordinates that the normal matrix
  carries through the axes' scale. A surface's triangles wind as MathBox's
  do: three draws a translucent mesh's back faces first, so winding decides
  how it overlaps itself.
- **An implicit surface is meshed on the CPU** (`graphics/implicit.ts`), so
  it draws on WebGL2 too. The equation is sampled once on a grid of `samples`
  cells per axis, 128 at most, then meshed by marching cubes with shared
  vertices and the grid's gradient as normals.
  - Marching cubes, not the surface nets Use.GPU draws: its silhouette
    keeps creases and cone points that surface nets round off or bridge, and
    it ends a surface exactly on the domain's faces with no padding or
    clipping.
  - Sampling is nearly all the cost, so a spec with the same `value`,
    `domain` and `samples` as the one drawn is not sampled again.
  - Triangles wind counterclockwise seen from where `value` is positive, so
    which side of a translucent surface shows through depends on the
    equation's sign.
- **Every point is a `Discs`** (`point/Discs.ts`), MathBox's circle point:
  a disc `size` across at view depth 1 with a one-pixel antialiased rim.
  Like MathBox it draws all fills, then all rims, so a rim's depth write never
  hides a farther disc.
- **`zBias` and `zIndex` go through `shader/depthStyle.ts`**, whatever the
  mark. `zBias` reproduces MathBox's under its perspective camera, stated as
  a change in view depth so it is the same on WebGPU and WebGL2 and in both
  projections; MathBox's own orthographic (a dolly) lets any `zBias` win
  outright.
- **Colors are output unconverted** (`outputColorSpace` is linear and
  `ColorManagement` is off), so they blend in sRGB as MathBox's do. three's
  default pipeline blends in linear space, which lightens every translucent
  mark.
- **Every label is a `Labels`** (`label/Labels.ts`), MathBox's `<Label>`:
  line and vector labels, and the point, axis and tick labels still to come.
  16 px `sans-serif` with a 2 px white outline, no LaTeX (MathBox has none).
  Unlike a stroke, it keeps its pixel size at any depth (MathBox's
  `attach.depth` is 0), so its quad is laid out in screen pixels around its
  projected anchor. All labels share one canvas atlas, drawn at the device
  pixel ratio and redrawn when the ratio changes.
- **Label offsets are on-screen CSS pixels** to the label's center. To match
  MathBox, a builder passes where a MathBox `<Label offset>` `[x, y]` lands,
  `[2x/3, 2y/3 − 8/3]`, rounded: MathBox scales the offset with its 24 px
  glyph atlas and draws its text 4 atlas px below each sprite's center.

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

- A new renderer draws from `useViewportSpec`'s output and reports camera
  moves to its `onCameraMove`; what else touches the store (fallback on
  `onUnsupported`) stays in its `app` glue. Adding one touches the renderer
  list, `MainPage`'s map and the lint zones.
- While MathBox stays, the app ships two copies of `three`: the main bundle
  carries `0.147` and the three.js chunk its own. three.js logs "Multiple
  instances of Three.js being imported" when that chunk loads.
- MathBox stays outside the contract while it reads math items directly.
- In three.js, an item draws as one block: none of its parts can go between
  another item's parts. MathBox is the same, since math3d gives every part of
  an item one `zOrder`.
- Opaque three.js draws follow item order, not front to back (unmeasured;
  expected negligible at math3d's scene sizes).

## Alternatives considered

- **Each renderer reads the store itself.** Use.GPU and a separate-workspace
  three.js renderer can't, and the spec components would be duplicated per
  renderer.
- **Coverage tables in `@math3d/viewport-spec`.** They key on
  `mathitem-configs` types, which would give the package a dependency.
