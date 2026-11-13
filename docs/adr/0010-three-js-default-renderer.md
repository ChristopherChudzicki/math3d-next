# 0010 — three.js as the default renderer

**Status:** Proposed

## Context

The viewport had three renderers: MathBox (the default), Use.GPU
([ADR-0008](0008-usegpu-opt-in-renderer.md)) and three.js
([ADR-0009](0009-renderer-neutral-viewport-spec.md)), the last two opt-in.

- three.js blends translucent items order-independently, which MathBox
  can't, and falls back to WebGL2 where WebGPU is missing, which Use.GPU
  can't.
- Use.GPU is alpha, renames between minors, and needed a hand-kept Yarn
  patch.

## Decision

**three.js is the default renderer. MathBox stays as an opt-in, labelled
legacy. Use.GPU is removed.**

- A valid `?renderer=` wins, then the stored preference, then the default.
  `?renderer=usegpu` is invalid like any other value.
- The preference is stored under a new key, `renderer`. The old
  `rendererPreference` is ignored: a `mathbox` there was mostly a choice of
  "the default".
- The menu offers "Default" (three.js) and "Legacy (MathBox)". The corner
  pill names MathBox when it draws.
- When three.js can't draw, `RendererFallback` says so and offers the legacy
  renderer. There is no automatic fallback: a silent switch would hide the
  failure from the user and from Sentry.
- `/app/frame/:sceneKey` follows the default, and so do OG images: the
  screenshot Worker and the default-image build send no `?renderer=`. In
  Cloudflare Browser Run, which has no WebGPU, three.js draws them on WebGL2.
- The renderer registry, `?renderer=`, the menu group, the per-page
  viewport maps and the per-folder lint zones stay, so a third renderer is
  one more entry.

## Consequences

- WebGPU detection is gone: three.js picks its own backend and reports
  `onUnsupported`. A future WebGPU-only renderer needs gating again.
- A browser with neither WebGPU nor WebGL2 gets a message and a button, not
  a scene.
- The main bundle still carries MathBox and its `three@0.147`, so the default
  path downloads both copies of `three`.

## Alternatives considered

- **Keep Use.GPU as an opt-in.** It costs an alpha dependency tree and its
  patch, and every item type it draws, three.js draws too.
- **Keep stored preferences.** Users who picked MathBox while it was "Default"
  would stay on it without having chosen it.
