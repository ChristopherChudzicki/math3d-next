# 0007 — Bulletproof React layout for `packages/app/src`

**Status:** Proposed

## Context

`src/features/` was meant to organize the app by feature, but most of it was
one feature: the scene. Its seams were in the wrong places.

- **The scene's Redux slice and MathScope hooks lived in the sidebar,** at
  `features/sceneControls/mathItems/sceneSlice/`. The 3D renderer, `store/`
  and `test_util` reached three levels into editor UI for them, and
  `store.ts` imported through a barrel that pulled the item-editing UI into
  the store's module graph.
- **"scene" meant two things:** `features/scene` was the MathBox viewport plus
  a few model helpers.
- **Folders imported each other in both directions** (`sceneControls` ↔
  `sceneActions`; `overlays` → `pages`), and nothing enforced a direction.

## Decision

**Follow [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)'s
three tiers — shared → features → app — imported one way, enforced by its
`import/no-restricted-paths` zones plus a few of our own.**

| Bulletproof            | here                            |
| ---------------------- | ------------------------------- |
| `app/`, `app/routes/`  | `app/`, `app/pages/`            |
| `features/<name>/`     | `features/<name>/`              |
| `components/ui`        | `ui/`                           |
| `lib/`                 | `services/`                     |
| `stores/`              | `store/` (incl. `store/scene/`) |
| `config/`              | `config/`                       |
| `utils/`, `hooks/`     | `util/`                         |
| `testing/`             | `test_util/` (tests only)       |
| feature `api/`, `api/` | `packages/api`                  |

- **Features:** `viewport`, `editor`, `sceneActions`, `library`, `auth`. No
  feature imports another.
- **Pages are routes:** `app/pages` holds everything with a route or an
  `?overlay=` name, along with its page-local logic and styles.
- **The scene model is shared**, in `store/scene/` (`state/`, `evaluation/`,
  `sceneTitle`, `defaultScene`). It imports no `ui`; `ui`, `util`,
  `services`, `config` and `types` don't import it; `state/` doesn't import
  `evaluation/`.
- **Imports leaving a module's folder use `@/`;** lint bans `../`. The Worker
  is exempt (its tsconfig has no alias) and imports only `sceneTitle`.

## Consequences

- **When a zone gets in the way,** in order: coordinate through shared state
  (`store/scene`); open another feature's UI through the overlay URL
  (`useOverlay`, mapped to pages in `app/overlayRegistry`); or have a page
  pass a slot prop or provide a context defined in the shared tier (e.g. a
  viewer mode's `canEdit`). Moving feature code into the shared tier to
  dodge a zone is not on the list.
- **Lint reads the feature list from `src/features/`,** so a new feature
  folder gets its zone without a config edit.
- **Only tests import `test_util`:** it renders the whole app, so a
  production import would reach `src/app` without crossing a zone.
- **The scene ↔ store cycle stays type-only:** `selectors.ts` uses
  `import type { RootState }`, which `import/no-cycle` skips.
- **No tier- or feature-root barrels;** a component folder's `index.ts` only
  re-exports its component, as in Bulletproof.
- **Naming:**
  - tier and feature folders are camelCase (`util/hooks`,
    `features/sceneActions`);
  - below them, a folder named for a component is PascalCase
    (`items/FieldWidget`, `pages/MainPage`);
  - folders in `ui/` are PascalCase (`ui/Button`, `ui/Banners`), except
    `ui/dnd`;
  - file names are not kebab-case.
- **Departures from Bulletproof:** feature internals are split by sub-area
  (`editor/{sidebar,items}`), not file type; shared folders keep their names.
- **`config/` holds one module per env value that a spec mocks or several
  files read** (`displayAuthFlows`, `issueUrl`, …), so a spec can `vi.mock`
  one. A single consumer's read, or a call-time read a spec `vi.stubEnv`s,
  stays inline.
- **Known debt:**
  - the slider animation clock ticks from the `VariableSlider` form, so it
    stops when the form unmounts;
  - `activeItemId`/`activeTabId` (session state) share the scene slice with
    the document;
  - `OverlayName` in `services/overlays/useOverlay.ts` names app pages from
    the shared tier.

## Alternatives considered

- **Feature-Sliced Design.** Has a first-class `entities` layer, but every
  module needs a feature/widget/entity ruling and per-slice segments — heavy
  for ~200 files.
- **A domain layer `features/scene`** imported by `viewport` and `editor`,
  with a hand-written zone table. Same dependency graph; Bulletproof's stock
  zones drift less, and a known layout is easier to explain.
- **Item-type folders** (`items/<Type>/{Form,Graphic}.tsx`). Optimizes adding
  an item type — rare — at the cost of cross-cutting form changes, the common
  case.
