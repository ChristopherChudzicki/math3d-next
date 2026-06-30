# Fallback Error Page — Design Spec

Issue: [#1011 "Better Error Page"](https://github.com/ChristopherChudzicki/math3d-next/issues/1011)

## Problem

When the React app throws during render, users currently see React Router's
raw default boundary: a bold **"Unexpected Application Error!"**, the full
JS stack trace, and a "Hey developer 👋" hint. It's hostile to the ~95% of
users who are students/educators and looks broken/unbranded.

`routes.tsx` already reserves the integration point:

```tsx
const routes: RouteObject[] = [
  {
    // Saving a slot for errorElement   <-- here
    children: [ ... ],
  },
];
```

## Goal

A branded, reassuring fallback that:

- conveys "something broke" with a fun, on-brand **mathy graphic** (a broken
  torus — a parametric donut with a wedge bitten out and fragments drifting off);
- tells a non-technical user what happened and what to do (reload);
- keeps the stack trace available for developers, but collapsed, not in your face;
- is **easy to iterate on for copy and visual design** (the expected source of
  follow-up feedback), so copy strings and design tokens are centralized.

## Direction (chosen: "B+A hybrid")

From three explored concepts, the chosen direction is **B's copy + broken-torus
treatment, presented on A's light, on-brand centered card.**

- Light background, centered card — reads like Math3d's own light-mode UI.
- Broken torus as the hero graphic, drawn so the break is legible (a **dashed
  "ghost" outline** marks the removed wedge; 1–2 clearly-detached ring fragments,
  not a vague smudge).
- Headline: **"We hit a discontinuity."** — plain English to anyone, a real math
  pun to those who get it, and uses "we" (no user-blame).

### Copy (honest — no false data-safety promise)

Editor state lives only in in-memory Redux (`state.scene.dirty`); there is **no
autosave / no `localStorage` persistence**, so a reload drops unsaved edits.
Therefore copy must **not** claim "your work is safe / isn't lost."

| Slot             | Text                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Eyebrow          | `Application error`                                                                                       |
| Headline         | `We hit a discontinuity.`                                                                                 |
| Subtext          | `Math3d ran into an unexpected error and couldn't finish rendering. Reloading the page usually fixes it.` |
| Primary button   | `Reload page` (↻) — `window.location.reload()`                                                            |
| Secondary button | `Back to home` — link to `/`                                                                              |
| Disclosure       | `Technical details` → error message + stack, with a **Copy** button                                       |
| Footer link      | `Report this bug ↗` → GitHub new-issue URL                                                               |

All copy lives in one module (`errorPage.copy.ts`) so wording is a one-file edit.

## Architecture

New directory `packages/app/src/pages/ErrorPage/` (routes already live under
`pages/`). Split presentational vs. wiring vs. graphic so each unit is testable
and restyleable in isolation:

| File                   | Responsibility                                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ErrorPage.tsx`        | Route `errorElement`. Calls `useRouteError()`, normalizes the thrown value into `{ message, stack }` (handles `Error`, `isRouteErrorResponse`, and unknown), passes to `ErrorView`. Default `onReload = () => window.location.reload()`. |
| `ErrorView.tsx`        | **Pure presentational.** Props: `{ message?, stack?, onReload, homeHref, reportHref }`. Renders graphic + copy + actions + collapsible details. No router/window deps → trivially testable and the place design feedback is applied.     |
| `BrokenTorus.tsx`      | Self-contained SVG graphic. Computes torus wireframe paths from the parametric equations (deterministic; no randomness) and renders an `<svg>`. Accepts a few props (size, palette) with sensible defaults. `aria-hidden` (decorative).  |
| `errorPage.copy.ts`    | All user-facing strings + external URLs. One-file copy edits.                                                                                                                                                                            |
| `ErrorPage.module.css` | Styling via existing CSS-module + `--color-*` token conventions.                                                                                                                                                                         |
| `index.ts`             | Re-export `ErrorPage`.                                                                                                                                                                                                                   |

Wiring: set `errorElement: <ErrorPage />` on the top-level route object in
`routes.tsx`.

### Broken-torus graphic

Real parametric torus, projected to 2D:

```
x = (R + r·cos v)·cos u,  y = (R + r·cos v)·sin u,  z = r·sin v
```

- u-cross-section rings sampled around the tube, **skipping an angular wedge**.
- Back-facing geometry is faded (depth-based opacity) for form.
- The removed wedge is marked by a **dashed ghost ring** (the "missing piece")
  and the trailing cut face is drawn as an emphasized solid ring.
- 1–2 detached ring fragments drift out of the gap to read as "broken off."
- Strokes use brand blue (`--color-primary` family). Output is a few KB of inline
  SVG — crisp at any size, theme-colorable, no raster asset.
- Static by default. Any future entrance/idle motion must respect
  `prefers-reduced-motion`.

## Accessibility

- The message block (not the whole page) carries `role="alert"` /
  `aria-live="assertive"`, and the **explanatory subtext is inside that live
  region** so a screen reader announces the explanation, not just the pun.
- Torus SVG is `aria-hidden="true"` (decorative).
- Disclosure is a native `<details>`/`<summary>` (keyboard-operable, announced
  as expandable). Copy button has an accessible label and a copied confirmation.
- Body and footer text must meet WCAG AA (≥4.5:1) on the light card — verify the
  muted grays; darken if short.

## Scope / non-goals

- Scope: the **route-level `errorElement`** (covers render errors anywhere in the
  routed tree, including the 3D scene, since it renders inside a route).
- Non-goals: a separate React class `ErrorBoundary`; a distinct 404 page;
  persisting unsaved scene state to survive reload (would let us make a
  data-safety promise — tracked separately, not in this issue); animated graphic.

## Testing

- `ErrorView.spec.tsx` — renders headline/subtext/buttons/links from copy;
  Reload button invokes `onReload`; `Back to home` points at `/`; details toggle
  reveals the stack; Copy button writes the trace to the clipboard; message block
  has `role="alert"`.
- `BrokenTorus.spec.tsx` — smoke test: renders an `<svg>` with `aria-hidden`.
- `ErrorPage.spec.tsx` — integration: a route that throws renders `ErrorView`
  (via `createMemoryRouter`), and `useRouteError` normalization shows the message.

## Out-of-the-box follow-ups (not blocking)

- Optional issue-prefill in the report link (error message in the URL).
- Optional `localStorage` scene persistence so recovery can promise data safety.
