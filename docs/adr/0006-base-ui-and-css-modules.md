# 0006 — Base UI + CSS Modules instead of MUI

**Status:** Accepted (2026-10-06)

## Context

The frontend was built on MUI 7 with Emotion. MUI's docs, composition and
accessibility were good. Its default look was not what we wanted: the ripple,
focus styles and button styles.

- **CSS-in-JS cost tooling.** Plain CSS gets better linting, and `jsx-a11y`
  can't see through styled wrappers. The app already styled almost everything
  with CSS Modules (+ `typed-css-modules`).
- **MUI use was shallow,** about 43 files. A handful were behavioral (Dialog,
  Popover, Menu, Tabs, Slider, Switch, Tooltip, Drawer); the rest were
  styled-only (Button, TextField, Alert, layout wrappers) plus 35
  `@mui/icons-material` imports.
- **Colors lived in two places and disagreed:** the `mui.ts` theme and the CSS
  custom properties in `globals.css`.
- **The MathLive virtual keyboard didn't work inside MUI popovers:** a key tap
  hit MUI's invisible backdrop and closed the popover.

## Decision

**Replace MUI and Emotion with [Base UI](https://base-ui.com) (`@base-ui/react`
1.x), styled by CSS Modules.** The move was incremental, with MUI and Base UI
side by side until the last call site moved. MUI and Emotion are no longer
dependencies.

## Alternatives considered

- **React Aria Components.** More battle-tested (touch, i18n), and has
  `GridList` for keyboard-navigable card collections. Rejected: a wordier
  render-prop/collection API, and Base UI's docs and composition are closer to
  what we liked about MUI.
- **Stay on MUI and restyle it,** using MUI 7's CSS layers so CSS Modules win
  without specificity fights. Rejected: it keeps the Emotion runtime, MUI's
  markup and ripple, `.Mui*` selectors, and the styled-wrapper lint blind spot.
  Pigment CSS (zero-runtime) was alpha and on hold.
- **Another styled library.** Rejected: the goal is owning the look.

## Consequences

- **`src/ui/` holds the generic components.** They know nothing about the app;
  app-specific config, such as MathLive keyboard layouts, is passed in as
  props. Lint enforces:
  - `src/ui` imports nothing from `features/`, `pages/`, `store/`, `services/`,
    `worker/`, `routes.tsx` or `AppProviders.tsx` (`import/no-restricted-paths`);
  - `@base-ui/react` is imported only inside `src/ui`;
  - `@mui/*` and `@emotion/*` are banned everywhere.
- **Styling.** CSS Module classes carry our own variants. Base UI's `data-*`
  attributes carry library-set state; disabled is styled only via
  `[data-disabled]`, because `focusableWhenDisabled` sets `aria-disabled`
  and `:disabled` won't match. Wrappers type `className` as `string`.
- **One set of color tokens,** in `globals.css`. `--color-primary` is MathBox's
  default blue (OKLCH hue 255) darkened for 4.5:1 text; any other blue keeps
  that hue.
- **Icons are Iconify (Lucide),** imported as data objects via
  `@iconify/react/offline`. String names (`"lucide:x"`) are banned by lint
  because they load at runtime from the Iconify API.
- **No grid or collection component.** Card grids with sub-actions, such as My
  Scenes, use plain markup: an `<li>` with a primary link and a ⋯ menu.
- **Overlays and MathLive.** Every overlay sits at `--z-index-overlay`, and the
  keyboard's `--keyboard-zindex` sits above it. `ui/Popover` cancels
  outside-press dismissal for presses on the keyboard or its toggle.
  Popovers inside sortable items need `data-dndkit-no-drag` on the popup,
  because portal events bubble through the React tree.
- **Field errors** show in a tooltip beside the focused field, and the message
  becomes the field's accessible description via `aria-describedby`.
  **Notifications** are modal and use `AlertDialog`, not a toast.
- **Storybook 10,** with one omnibus story per component, showing every
  variant in a labeled grid.
