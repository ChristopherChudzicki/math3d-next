# 0012 — TanStack Router instead of React Router

**Status:** Accepted

## Context

`packages/app` routes with React Router v7 in library mode (`createBrowserRouter`
plus a `RouteObject[]` in `app/routes.tsx`).

- **Nothing is typed.** Paths are strings, and every search param (ten of them)
  is read with `search.get("…")` and checked by hand. React Router types routes
  only in framework mode, which this SPA doesn't use.
- **To answer 404 for unknown paths** (the real-404 work), the metadata Worker
  needs its own list of real paths. Nothing can check that list against the
  routes.

## Decision

**Route `packages/app` with [TanStack Router](https://tanstack.com/router)
(`@tanstack/react-router` 1.x), using file-based routes and its default JSON
search serializer. Search params are validated by yup, leniently: a bad value
is logged and dropped, never thrown.**

### Routes

`src/app/routes/` (Bulletproof's `app/routes/`) holds route files only:

| File                      | Path                             | Component         |
| ------------------------- | -------------------------------- | ----------------- |
| `__root.tsx`              | —                                | `RootLayout`      |
| `{-$sceneKey}.tsx`        | `/`, `/:sceneKey` (optional key) | `MainPage`        |
| `app/help/reference.tsx`  | `/app/help/reference`            | `HelpPage`        |
| `app/frame/$sceneKey.tsx` | `/app/frame/:sceneKey`           | `FramePage`       |
| `app/sign-in-error.tsx`   | `/app/sign-in-error`             | `SignInErrorPage` |

- **Route files are thin:** options plus a component from `app/pages/`
  (`app/RootLayout` for the root). Pages never import route files; lint
  enforces it.
- **The root route has `errorComponent: ErrorPage`**, which also catches throws
  from `RootLayout`, and `notFoundComponent: NotFoundPage`. Unmatched paths go
  there, so there are no `*` routes. Its `onCatch` reports to Sentry each time
  the boundary catches, so `ErrorPage` only renders.
- **`{-$sceneKey}`'s `params.parse` throws `notFound()`** for a key that fails
  Django's `SCENE_KEY_PATTERN`, copied in `config/sceneKey.ts`. A well-formed
  key the API doesn't know reaches `MainPage`'s "This scene doesn’t exist."
- **Matching is case-sensitive** (`caseSensitive: true`), like scene keys.
- **`src/app/routeTree.gen.ts` is generated and committed.**
  - `yarn workspace app generate-routes` (`tsr generate`) regenerates it, and
    `typecheck` runs it first; CI fails on a diff.
  - `.gitattributes` marks it `merge=binary linguist-generated=true`. On a
    conflict, take either side and regenerate.
  - The Vite plugin and the CLI share `packages/app/tsr.config.json`, which
    also ignores `*.spec.*` and `*.stories.*` in `routes/`.
- **Vite plugin with `autoCodeSplitting: false`:** code splitting stays at the
  deliberate `React.lazy` boundaries ([ADR-0009](0009-renderer-neutral-viewport-spec.md)).

### The router

- **`src/app/router.ts` exports `createAppRouter({ history? })`,** called by
  `main.tsx` and `renderTestApp`. Its options live in `app/routerOptions.ts`,
  which the test routers spread too.
  `Register { router: ReturnType<typeof createAppRouter> }` types every hook
  globally.
- **Outside the route pages, code reads the URL through
  `services/navigation/urlState`:** `useRootSearch()`
  (`useSearch({ from: rootRouteId })`, typed exactly to the root's params) and
  `useRouteSceneKey()` (`useParams({ strict: false })`, since `sceneKey` lives
  on two routes). Shared code and overlays render on every page, and a read
  `from` a route that isn't matched throws: `from: "/{-$sceneKey}"` throws at
  `/app/help/reference?overlay=scenes`.
  - Lint bans the router's read hooks (`useSearch`, `useParams`, `useMatch`,
    `getRouteApi`, …) everywhere else. Only the folders of `MainPage` and
    `FramePage`, which render only on their own routes, use them directly,
    besides `urlState` itself. An import ban catches aliases, where a `from:`
    syntax rule wouldn't.
- **Layer content reads search params and history state through
  `useUrlLayerLocation()`, never `useRootSearch`:** the two update a render
  apart, and `UrlLayer`'s frozen location must agree with its `open` flag.
  History state lives only on the location (route matches carry none), so a
  layer reads both from `useLocation()`, against TanStack's general advice to
  prefer `useSearch`. The scene key, which a layer never changes, comes from
  `useRouteSceneKey`.
- **`useLocation().search` is raw but typed as validated:** the first render,
  before the mount rewrite drops bad values, sees them, so readers compare by
  equality or guard.
- **History state is typed** by extending `HistoryState` (re-exported by
  `@tanstack/react-router`) beside the code that owns each key (`useOverlay`,
  `useSignInDialog`). The double-close guard keys on `state.__TSR_key`; an
  entry React Router wrote (a tab open across the deploy) has none, and still
  closes.
- **Scroll:** `scrollRestoration: true`, keyed per history entry (TanStack's
  default). `useSetSearch` passes `resetScroll: false`, so opening an overlay
  leaves the page where it is, and Back restores the entry's position; without
  restoration, Back would scroll to the top. The help page's contents are
  router links with a `hash`, not plain `#` links: a plain `#` click creates an
  entry with no state, and closing an overlay there jumps back to the heading.
  A typed `#` URL behaves the same way: Back to it, or closing an overlay on
  it, returns to the heading.
- **Sentry:** `services/sentry` inits early with no routing integration;
  `main.tsx` calls its `traceRouter(router)`, which adds
  `tanstackRouterBrowserTracingIntegration` with `Sentry.addIntegration`,
  before the router's first load.

### Search params

| Param                        | Owner (field lives here) | Schema                  |
| ---------------------------- | ------------------------ | ----------------------- |
| `overlay`, `list`, `signin`  | `services/overlays`      | enums, flag             |
| `renderer`                   | `services/renderer`      | `mixed().nullable()`    |
| `renderer` on `{-$sceneKey}` | `services/renderer`      | enum                    |
| `oit`, `gloss`               | `features/viewport`      | `mixed<0>().oneOf`      |
| `controls` on `{-$sceneKey}` | `app/pages/MainPage`     | `mixed<0 \| 1>().oneOf` |
| `error`, `error_process`     | `features/auth`          | `string()`              |
| `test-sync-error`            | `app/pages/ErrorPage`    | `string()`              |

- **A field lives in the lowest tier that reads or writes it.** Owners export
  a fields object; `app/searchFields.ts` spreads them into one for the root
  route's `lenientSearch`. Each field types as its literal union: a string
  `oneOf` narrows from an `as const` array, and a numeric one needs `mixed<…>`
  (yup narrows `oneOf` only on strings).
- **Every param is on the root schema except `controls`,** which only the
  editor reads. `renderer` is on the root as any value, `null` included, and
  the editor narrows it to a renderer, so a bad one is logged and dropped
  there. A child's `validateSearch` gets the parent's result and is spread on
  top of it,[^merge] so a child can narrow a param its parent accepts, but
  can't recover one its parent dropped. `FramePage` marks an unknown renderer
  failed (`data-scene-error="invalid-renderer"`): a screenshot never falls
  back to another renderer (ADR-0009). Shared code sees `renderer` as
  `{} | null | undefined` and keeps its `isRenderer` guard.
- **Params other systems write** (allauth's `error`, `error_process`) are
  `string()`, so an unknown code still reaches `toSignInError` and maps to
  `"unknown"`.
- **`validateSearch` is `lenientSearch(fields)`** (`util/`), which validates
  field by field and sets a bad field to `undefined`, so its default applies.
  It must overwrite the field, not omit it: the router merges the raw search
  under the validated one.[^merge] The log may repeat for one bad value.
- **The router removes a bad value from the address bar on load**
  (`/abc?renderer=foo&oit=0` → `/abc?oit=0`).

### Writing the URL

- **`useSetSearch()` (`services/navigation/`) is the one way to edit the
  current URL's search params.** It keeps the hash, history state and scroll
  (a bare navigate drops the first two), takes `replace` and a `state`
  updater, and types its patch with every route's search, which catches
  misspelled keys. `unsafeRelative: "path"` (undocumented; `NotFoundPage.spec`
  pins it) resolves `.` against the URL's path, so a dialog closed on the
  not-found page stays there.
- **A link target passed around as a value is built with `linkOptions()`**
  (`sceneLink`/`homeLink` in `services/navigation/`, `sceneCardLink` in
  `features/library/useSceneLinks`), never a hand-written `LinkOptions`
  literal, which skips param and search checks.
- **Optional params carry over when omitted:** `to: "/{-$sceneKey}"` from `/abc`
  is `/abc`. The builders always pass `params`, `undefined` included.
- **`ui/Anchor`'s router mode is `Link`, typed `LinkComponent`,** so
  `TextLink`, `ButtonLink` and `HomeLink` take typed targets. It counts a link
  active only at exactly its own URL, hash included
  (`activeOptions: { exact: true, includeHash: true }`): by default the router
  counts `/` as active on every page, and every contents link as active on the
  help page. An active link gets `aria-current="page"` from the router, over
  a caller's own value.

### Tests and stories

- **The test helpers `await router.load()` before `render`,** on memory
  history, so the first render is complete. `renderTestApp` is async and uses
  `createAppRouter`; lint fails a spec that drops a promise.
- **`renderWithRouter(ui, { url, state })`** (`test_util/routerTesting`)
  mounts a component under one root route with the app's options and root
  search fields; `url` may be a list of entries. `state` is seeded with `history.replace` before
  the router exists. `navigateTo`, `goBack` and `goForward` wrap navigation in
  `act`.
- **`renderTestApp`'s `location` reports `search` and `hash` as in the URL.**
  State assertions use `toMatchObject`: TanStack adds `key`, `__TSR_key`,
  `__TSR_index` and `__hashScrollIntoViewOptions`.
- **A spec that expects a render error mocks `console.warn` as well as
  `console.error`:** in dev, TanStack warns on every caught error, and
  `failOnConsole` fails on both.
- **`setupTests.ts` stubs `window.scrollTo` and `Element.scrollIntoView`,**
  which jsdom doesn't implement and the router calls.
- **Storybook gives every story router context** (`RouterContextProvider` in
  `.storybook/withRouter.tsx`), enough for links. No route matches, so a story
  of a component that reads the URL would throw.

## Alternatives considered

- **Stay on React Router v7.** Library mode is its most stable surface.
  Rejected: no typed paths or search params in a SPA, and no path list the
  Worker can be checked against. Framework mode means adopting React Router's
  build.
- **Code-based TanStack routes.** TanStack calls them "not recommended for most
  applications", and every route wires its own parent for types.
- **Route masking for overlays.** Masks live in history state and vanish from a
  shared link; `?overlay=` must survive one (`sceneCardLink` writes it).
  `useCanGoBack()` can't replace the pushed flags either: it can't tell an
  overlay the app pushed from one that arrived in a link.
- **Scene loading in route loaders (`ensureQueryData`).** An awaited loader
  hangs navigation offline (the paused query never settles), sends a 404 to
  the root `errorComponent` instead of "This scene doesn’t exist.", and makes a
  just-published scene wait on a fetch the store doesn't need. A loader that
  only starts `prefetchQuery(sceneQueryOptions(key))`, with
  `defaultPreload: "intent"`, would prefetch on hover; `createAppRouter` would
  then take a `queryClient` in router `context`.
- **A plain `URLSearchParams` serializer** keeps every value a string. Rejected
  for now: the default handles every param the app reads.[^serializer]
- **Zod v4.** Its `.catch()` gives per-field fallback without a helper.
  Rejected: yup 1.x already validates in three packages and implements
  Standard Schema.

## Consequences

- **A Worker path table can be checked against `FileRouteTypes["fullPaths"]`**
  once the real-404 work adds one. It must import nothing, like
  `config/sceneKey.ts`: the Worker's tsconfig can't load route types.
- **Bundle size is a wash:** about 28 KB gzipped for TanStack Router against
  33 KB for React Router, for the exports this app uses.[^bundle]
- **Sentry transaction names become route ids** (`/{-$sceneKey}` in place of
  `/:sceneKey`), and every URL edit (an overlay opening or closing, a
  `?controls=` toggle) starts a navigation span.
- **Navigation is async:** code must not expect the route to follow a store
  change within a render (publishing a scene, `SceneTitle`); the
  `saving-and-sharing` E2E specs cover it.
- **TanStack Router releases often** (1.170 at adoption). A Renovate group keeps
  `@tanstack/react-router`, `router-plugin` and `router-cli` in step, so the
  CLI and the plugin pin the same `router-generator`. The app imports
  `router-core` and `history` types through `@tanstack/react-router`'s
  re-exports, so their versions are the ones it pins.
- **ADR-0007's tier table gains `app/routes/`.**
- **The swap can't be staged:** two routers can't both own the URL.

[^merge]: `router-core` `matchRoutesInternal`: `{ ...parentSearch, ...strictSearch }`.
[^serializer]:
    `defaultStringifySearch = stringifySearchWith(JSON.stringify, JSON.parse)`
    (`router-core/src/searchParams.ts`). A string-typed value that parses as
    JSON (`"0"`, `"true"`) is written quoted. Params the app doesn't read are
    parsed too and re-serialized on load (the router canonicalizes the URL),
    so a digit-only value past 2^53 (a long numeric ad id, say) loses
    precision.

[^bundle]: esbuild, minified, React external, for the router exports this app uses; 2026-11-26.
