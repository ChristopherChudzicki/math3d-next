/**
 * Options the app's router and the test routers share. Restoration is per
 * history entry: an overlay opens with `resetScroll: false` (`useSetSearch`),
 * so the page stays put, and Back restores where the entry was.
 */
export const ROUTER_OPTIONS = {
  caseSensitive: true,
  scrollRestoration: true,
} as const;
