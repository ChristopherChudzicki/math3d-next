# 0009 — A renderer-neutral viewport contract

**Status:** Proposed

## Context

MathBox reads math items from the store inside its own React tree. Use.GPU
([ADR-0008](0008-usegpu-opt-in-renderer.md)) can't: its components are not
React components. A planned three.js renderer may be its own workspace, with
a different `three` than `mathbox-react` allows, and so can't import `app`
at all. Both need the scene as plain data.

## Decision

**A renderer that can't read the store draws from a `ViewportSpec` and
reports back through `ViewportHooks`, both types in
`@math3d/viewport-spec`.**

- **`@math3d/viewport-spec`** holds types only (`ViewportSpec`,
  `ViewportHooks`, `GraphicSpec`, `CameraSpec`, `RGBA`, `Coords`,
  `AxesRange`): no runtime dependencies on `app`, React or any renderer.
- **`ViewportSpec`** is the axes' range and scale, the camera (`CameraSpec`
  in view coordinates, an orthographic flag, the enabled controls) and the
  graphics as an ordered `{ id, spec }` list.
- **`ViewportHooks`**: `onUnsupported(error)` when the renderer can't run in
  this browser; `onCameraMove(camera)` as the user moves the camera. The app
  decides when a move ends and what to write back.
- **`features/viewport/spec/`** produces it: `useViewportSpec` returns the
  spec plus the reporter elements to render alongside the renderer, which
  feed it each graphic's spec.
- **A renderer derives its own shapes from `ViewportSpec`**, next to its
  glue: Use.GPU's `SceneSpec` swaps the camera for y-up orbit parameters.
- **Coverage tables stay in `app`**, one per renderer folder, typed by
  `shared/coverage.ts`, so the package needs nothing from `mathitem-configs`.

### Folders and lint zones

`features/viewport/` holds one folder per renderer plus `shared/` and `spec/`,
with zones written by hand in `packages/app/.eslintrc.cjs`:

- **`shared/`** is imported by the renderers and `spec/`; it imports none of
  them.
- **`spec/`** reads the store and MathScope and produces specs; it imports no
  renderer, and any renderer may import it. Use.GPU draws from the specs;
  MathBox still reads math items directly. **A spec field is in math-item
  terms only** (evaluated positions, RGBA colors, sample callbacks), never a
  renderer prop, so the specs are testable under jsdom and survive a renderer
  swap.
- **`spec/` and `shared/` import no renderer package** (`three`, `mathbox*`,
  `@use-gpu/*`; a `no-restricted-imports` group). The path zones above
  check folders only.
- **The renderer folders** (`mathbox/`, `usegpu/`) don't import each other;
  common code moves to `shared/` or `spec/`.
- **`usegpu/live/`** is the only code that imports Use.GPU's runtime
  (`@use-gpu/*` except `@use-gpu/core`, enforced by `no-restricted-imports`).
  Only `usegpu/GpuViewport` reaches it (an `import/no-restricted-paths` zone).

## Consequences

- A new renderer draws from `useViewportSpec`'s output; what touches the
  store (camera write-back, fallback on `onUnsupported`) stays in its `app`
  glue.
- MathBox stays outside the contract while it reads math items directly.
- Use.GPU doesn't call `onCameraMove` yet: its write-back
  (`usegpu/useOrbitWriteBack`) reads orbit parameters, and moves behind the
  hook in the three.js camera work.

## Alternatives considered

- **Each renderer reads the store itself.** Use.GPU and a separate-workspace
  three.js renderer can't, and the spec components would be duplicated per
  renderer.
- **Coverage tables in `@math3d/viewport-spec`.** They key on
  `mathitem-configs` types, which would give the package a dependency.
