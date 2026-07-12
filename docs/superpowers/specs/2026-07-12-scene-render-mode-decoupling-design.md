# Design: Decouple scene-loading from chrome + a scene-only `/app/frame/` render page

**Date:** 2026-07-12
**Branch:** `scene-render-mode-decoupling`
**Supersedes the investigation in:** `docs/superpowers/specs/2026-07-12-scene-render-mode-decoupling-handoff.md`
**Unblocks:** `docs/superpowers/specs/2026-07-11-og-metadata-worker-design.md` (per-scene social-share images)

## Problem

`SceneControls` conflates two unrelated responsibilities:

1. **Data** — `useLoadSceneIntoRedux` (`SceneControls.tsx:16`) fetches the scene (React Query), dispatches `setScene` into Redux, sets `document.title`, and handles 404 (notification + redirect).
2. **Presentation** — renders the editor chrome (`ControlTabs`, `AddObjectButton`, `MathItemsList`).

`<Scene>` renders purely from Redux — it gates on `select.hasItems(REQUIRED_ITEMS)` (`Scene.tsx:106`) and only mounts MathBox once those items exist. So `<Scene>` structurally depends on responsibility #1 having run, but #1 only runs as a side-effect of mounting the chrome for #2. You cannot hide the chrome by unmounting it without also killing scene-loading.

The existing `?controls=0` param does **not** address this: `Sidebar` keeps its children mounted and merely toggles an `inert`/`aria-hidden` CSS state (`Sidebar.tsx:43,74`). `SceneControls` — and any running timer — stays mounted. It hides pixels, not the coupling.

This blocks a **scene-only render page**: a URL a headless browser can load to screenshot just the 3D canvas — no header, sidebar, toolbar, or FPS overlay — for per-scene social-share images.

## Goals

1. Scene data loads via a hook that does **not** require `SceneControls` to be mounted.
2. A dedicated `/app/frame/:sceneKey` route renders only the 3D scene, full-viewport, with real data.
3. The frame page halts its render loop once the scene settles (no perpetual ~60fps) and exposes a readiness signal for a headless screenshotter.
4. The captured frame is deterministic (no auto-advancing animation).
5. None of this mutates persisted state (there is none) or the normal editor experience.

## Non-goals (deferred)

- The OG-metadata Worker and the actual screenshot/capture pipeline (separate downstream effort; this only provides the clean URL).
- A canonical default camera framing for scenes the author never re-oriented — the frame page uses the scene's **stored** camera. Framing heuristics are a later, separate design question.
- Any change to how the normal editor loads, redirects, titles, or falls back to the default scene.
- **A headless animation controller** (deliberately out of scope, documented seam). The slider animation loop — `useInterval(tick, …)` inside `AnimatedSlider` (`VariableSlider/index.tsx:116`) — is driven by the slider _form UI_: `tick` dispatches the advancing `value` into Redux, which the scene then reads. Not mounting the sidebar removes that timer, which is exactly what a **still** wants (a frozen, deterministic frame). A hypothetical _live_ render route (animating, no UI) would instead need this tick relocated into a headless per-animating-slider controller that derives the same params (min/max/fps/duration/speed) and dispatches the same `patchProperty`. That controller is not built here — the still route relies on the timer's absence by design. Note the data flow already routes through Redux (the scene reads the store, not the slider component), so a future live route is additive: `headless page = loader + Scene` plus one more headless piece; it does not require reworking this design.

## Part 1 — Extract `useSceneLoader`

Lift the body of `useLoadSceneIntoRedux` into a standalone hook, co-located with the other scene concerns:

**`packages/app/src/features/scene/useSceneLoader.ts`**

```ts
type OnNotFound = "redirect" | "silent";

const useSceneLoader = (
  sceneKey: string | undefined,
  options?: { onNotFound?: OnNotFound },
): { isLoading: boolean } => {
  /* ... */
};
```

It keeps all current responsibilities:

- Fetch via `useScene(sceneKey, { enabled: sceneKey !== undefined, staleTime: Infinity })`.
- `defaultScene` fallback when `sceneKey === undefined` (unchanged — the home page's built-in scene).
- Dispatch `setScene` into Redux (still the only non-test `setScene` dispatcher).
- Set `document.title` (`Math3d - <title>` / `Math3d`).
- Return `{ isLoading }`.

**The one behavioral seam is 404 handling**, controlled by `onNotFound` (default `"redirect"`):

- `"redirect"` — current behavior: add the "Not found" notification, set `document.title = "Not found"`, and on confirm `navigate("/")`.
- `"silent"` — no notification, no redirect, no navigation. The scene simply never populates Redux, so `<Scene>` stays blank. (A headless screenshotter must not be redirected or shown a dialog; it handles the missing scene via its own capture timeout.)

**Consumers:**

- `MainPage` calls `useSceneLoader(sceneKey)` (default redirect behavior) and passes `isLoading` to `<SceneControls loading={isLoading} />`.
- `FramePage` calls `useSceneLoader(sceneKey, { onNotFound: "silent" })`.

`SceneControls` becomes **presentation-only**: drop its `sceneKey` prop and the `useLoadSceneIntoRedux` definition entirely; accept `loading: boolean` and forward it to `ControlTabs`. It now reads Redux like every other control.

**Why a hook (not a React Router `loader` or a render-null component):** a router `loader` is built to _return_ data the route consumes, but loading here is a _side-effect_ (dispatch into Redux) layered on React Query's cache — bridging loader → Redux → RQ scatters scene-loading across router config and components and duplicates the fetch paradigm. A render-null `<SceneLoader>` component is functionally equivalent to the hook; the hook is chosen because each page can hand `isLoading` straight to its own presentation without an extra element. If a future need arises to mount loading at a specific tree position, the component variant is a trivial reshape.

## Part 2 — The `/app/frame/:sceneKey` render page

### Route

Register the route as a **child of the existing `app` route** (`routes.tsx`), alongside `help/reference`:

```tsx
{
  path: "app",
  children: [
    // ...existing children (index, help/reference, catch-all)...
    { path: "frame/:sceneKey", element: <FramePage /> },
  ],
}
```

`/app/` is the deliberate namespace for non-scene routes (established in #1159): scene keys own the root single-segment namespace (`/:sceneKey?`), so everything else lives under `/app/` — as `help/reference` already does. Putting the render page at `/app/frame/:sceneKey` follows that convention and avoids the root-level ambiguity a `/frame/…` route would create (a scene literally keyed `frame` sits at `/frame`).

A **dedicated route** is chosen over a `?frame=1` flag on `MainPage`: frame mode hides _all_ chrome and changes render-loop behavior, so a flag would scatter conditionals through MainPage's Header / Sidebar / banners / legacy-dialog tree. A separate thin page leaves `MainPage` completely untouched — and both pages calling the same `useSceneLoader` is exactly the payoff of Part 1.

### `FramePage`

**`packages/app/src/pages/FramePage/FramePage.tsx`** — a thin page that renders only the scene:

```tsx
const FramePage: React.FC = () => {
  const { sceneKey } = useParams();
  useSceneLoader(sceneKey, { onNotFound: "silent" });
  return <Scene still className={/* full-viewport */} />;
};
```

No `Header`, `Sidebar`/`SceneControls`, `ToggleKeyboardButton`, banners, or legacy dialog. `<Scene>` fills the viewport (100% width/height, no sidebar margin).

### Removing the FPS overlay (both modes)

The stats.js FPS overlay (`stats` in `mathboxOptions.plugins`, `Scene.tsx:29`) is dropped from **all** scene rendering — it doesn't fit the rest of the UI and is usually obscured by the controls. `mathboxOptions.plugins` becomes `["core", "controls", "cursor"]` for interactive and frame modes alike. `controls` and `cursor` stay: `<Camera>` applies the scene's stored camera _target_ via MathBox's `<Threestrap.Controls target={controlsTarget}>` (`Camera.tsx:127–134`), which is part of the `controls` plugin — dropping it would break framing (the camera would ignore the stored target and look at the origin). The `up: Vector3(0,0,1)` camera option is retained.

Because the plugin set is now identical in both modes, the `still` seam does **not** touch plugins.

### A `still` seam on `<Scene>`

Add an optional `still?: boolean` prop to `<Scene>`. (The prop describes the _behavior_ — a frozen, single frame; the route is named `/app/frame/` as a URL choice. They intentionally read slightly differently.) When `still` is set, it does exactly two things:

1. **Halt the render loop once settled.** There is no MathBox idle event, and with sliders unmounted the scene is deterministic, so "settled" is approximated by a **fixed warmup**: after MathBox mounts, allow a small fixed number of post-render frames (a tunable constant), then call `mathbox.stop()` (`window.mathbox` is already assigned in `Scene.tsx:37`). This ends the perpetual loop so the screenshot-taker's CPU isn't pegged.
2. **Expose a readiness signal.** Once stopped, set `data-scene-ready="true"` on the scene container `<div>`. A headless screenshotter waits on this selector before capturing. (Neutral name — a property of "the static scene is drawn and stopped", independent of the route name.)

Interactive `<Scene>` (no `still`) behaves as before, minus the now-removed FPS overlay.

### Determinism / freeze — verified

The only auto-advancing timer in the app is the slider's `useInterval` (`VariableSlider/index.tsx:116`), which lives inside the sidebar. There is no `autoRotate`, no global clock, and no `t`. `FramePage` mounts no sidebar, so the frame is already frozen with no extra work. `<Scene>`'s camera-move `patchProperty` (`Scene.tsx:53–71`) fires only on OrbitControls' `onEnd` (a real drag). A headless capture sends no pointer input, so it never fires and no state mutation occurs — even though the `controls` plugin stays mounted.

## Files touched

- **New:** `features/scene/useSceneLoader.ts`, `pages/FramePage/FramePage.tsx` (+ index), and any `FramePage.module.css` for full-viewport layout.
- **Edit:** `features/sceneControls/SceneControls.tsx` (remove data hook + `sceneKey` prop; accept `loading`), `features/scene/Scene.tsx` (remove `stats` from `mathboxOptions.plugins`; add `still` prop: loop halt + ready attribute), `pages/MainPage/MainPage.tsx` (call `useSceneLoader`, pass `loading`), `routes.tsx` (add `frame/:sceneKey` under the `app` route → `/app/frame/:sceneKey`).

## Testing

- **Unit (`useSceneLoader`):** dispatches `setScene` for a loaded scene; falls back to `defaultScene` when `sceneKey` is undefined; sets `document.title`; `onNotFound: "redirect"` produces notification + navigate on a 404; `onNotFound: "silent"` produces neither. (MSW + mock-api `SceneBuilder`.)
- **Unit (`SceneControls`):** renders controls from Redux state and reflects the injected `loading` prop; no longer performs any fetch.
- **Unit (`FramePage`):** with a loaded scene in Redux, renders the scene container and none of Header / Sidebar / ToggleKeyboardButton.
- **Unit (`MainPage`):** unchanged behavior — loads, redirects on 404, sets title, default-scene fallback.
- **E2E:** the suite disables 3D by default (`disable3d`), so a `/app/frame/:sceneKey` e2e asserts the _chrome is absent_ and the scene container/data are present. The actual 3D render, loop-halt, and `data-scene-ready` signal must be **eyeballed manually with 3D enabled** (run `yarn test-e2e` before declaring `packages/app` work done, per repo convention, then manually verify a real 3D frame).

## Definition of done

- Scene data loads via `useSceneLoader`, independent of `SceneControls`.
- `/app/frame/:sceneKey` renders a chrome-less, full-viewport scene with real data; the render loop stops after warmup and `data-scene-ready` appears.
- Normal `MainPage` behavior (loading, 404 redirect, title, default-scene fallback) is unchanged, verified by unit + e2e.
- The stats.js FPS overlay no longer appears in the interactive scene (`stats` removed from `mathboxOptions.plugins`).
