# 0011 — `math3d.org` as the canonical host

**Status:** Proposed

## Context

This app replaces the legacy site (math3d-react) on the main domain at the end of December 2026. Today the legacy site is at `www.math3d.org`, `math3d.org` redirects to it, and this app is at `next.math3d.org`. The move forces a choice the legacy site never made explicit: which of `www.math3d.org` and `math3d.org` is the real address.

The hazard: until 2026-11-25 the redirect from `math3d.org` to `www` was a `301` with no `Cache-Control` or `Expires` header. Chrome keeps such a redirect with no expiry, and Safari for a year, without asking the server again; Firefox does not reuse it.[^lifetime] This ADR calls such a leftover entry **the cached `301`**. Since 2026-11-25 the redirect is a `302`, which browsers do not reuse, but the entries already cached remain.

Making `math3d.org` canonical means `www` redirects to it. A browser holding the cached `301` is then sent to `www` by its own cache and back by the server, until it shows an error: in Chrome 158, `ERR_TOO_MANY_REDIRECTS`, with no request to `math3d.org` at all.[^test] Regular visitors who type `math3d.org` are the likeliest to still hold it, because the cache evicts what was used least recently.

## Decision

**`https://math3d.org` is the canonical host.** `www` and `next` redirect to it from a small Worker in this repo. The `www` redirect adds `?from_www=1`, so a browser holding the cached `301` reaches the app instead of looping. The first time a browser arrives that way, the app clears its HTTP cache for `math3d.org`, the cached `301` included.

| Host              | Today                         | After the cutover                                                |
| ----------------- | ----------------------------- | ---------------------------------------------------------------- |
| `math3d.org`      | Redirect to `www`             | This app                                                         |
| `www.math3d.org`  | The legacy site               | Redirect to `math3d.org`, same path and query, plus `from_www=1` |
| `next.math3d.org` | This app                      | Redirect to `math3d.org`, same path and query                    |
| `old.math3d.org`  | The legacy site, as `noindex` | The same, until it is retired                                    |

Why `math3d.org`:

- _Opinion (owner's):_ it is the cleaner address to post and say aloud, and much of this choice is preference.
- Some visitors already use it: Cloudflare counted about one request to `math3d.org` for every six to `www`. A `www` visit is many requests and a `math3d.org` visit is one redirect, but bots inflate the `math3d.org` count.[^traffic]

### The redirect Worker

One Worker, in this repo with its own `wrangler.jsonc`, answers every request to `www.math3d.org` and `next.math3d.org`:

- `301` to the same path and query on `math3d.org`; `308` for anything but `GET` and `HEAD`, so a request keeps its method.
- **`Cache-Control: no-store` on every redirect.** The `301` tells search engines the move is permanent; `no-store` keeps browsers from caching it, so a wrong redirect can be fixed on the server.[^nostore]
- From `www` only, it appends `from_www=1` to the query. Only the name is read; the value is ignored.
- The target's host is the constant `math3d.org`, with the request's path and query copied onto it. Building the target by resolving the path as a URL would let `www.math3d.org//evil.example` redirect off the site.
- Its routes name the two hosts exactly. A wildcard would catch the API's host.
- The `www` and `next` redirects can be started and stopped separately.

### Past the cached `301`

1. A browser holding the cached `301` is sent from `math3d.org/abc` to `www.math3d.org/abc` by its own cache.
2. The redirect Worker sends it to `math3d.org/abc?from_www=1`. The cache is keyed by the whole URL, so this one is not in it and the request reaches the app. **This step alone prevents the loop.**
3. On every arrival with `from_www`, the app removes it from the address bar with `history.replaceState`, before Sentry or the router reads the URL.
4. If a `localStorage` flag is not yet set, the app fetches `/app/clear-cache` (the clear route) in the background, then sets the flag. The route belongs to the app's Worker and answers with `Clear-Site-Data: "cache"`: the browser drops its HTTP cache for `https://math3d.org`, the cached `301` for every path included. Cookies and `localStorage` are untouched.[^csd]

Step 4 is an optimisation. Without it, step 2 still prevents the loop, and each later visit by a browser holding the cached `301` takes one extra redirect through `www`.

Measured locally:[^test]

- Chrome: affected. The clear removes the cached `301` for every path, however it was cached.
- Firefox: not affected. It asks the server again before reusing a `301` without freshness headers.
- Safari: affected, and the clear had no effect, for a reason not yet known.[^safari] Its entries expire by 2027-11-25, a year after the last one could have been cached.

### How long this stays

- The redirect Worker stays for as long as `www` and `next` redirect.
- `from_www` stays for as long as `www` redirects, unless the owner decides otherwise. Without it, a browser that still holds the cached `301` gets the error page. Chrome's entry has no expiry, and nothing can count browsers that have not come back, so no measurement shows when removal is safe.
- _Opinion (owner's):_ the site is about ten years old. Dropping `from_www` would probably be acceptable after two years and surely after five, and most likely it simply stays.
- Step 4 can be removed at any time. The cost is one redirect through `www` per visit for a browser still holding the cached `301`.

### Rules

- **Every redirect on these hosts is `no-store` or has an explicit, short lifetime.**
- Every page has a `rel="canonical"` link without `from_www`. Otherwise search engines index the URL they were redirected to. For `/` it is written into the static `index.html`, which the app's Worker never sees.
- `from_www` is removed in the browser only. A redirect that removed it would land on the cached `301` again.
- The clear route sends exactly `Clear-Site-Data: "cache"`, with `Cache-Control: no-store`; `"storage"` or `"*"` would erase every visitor's drafts.

### Cutover order

1. Ahead of time: ship the `rel="canonical"` links, and add `https://math3d.org` to the API's `CORS_ALLOWED_ORIGINS`.
2. Together, within minutes of each other:
   - remove the redirect from `math3d.org` to `www` and attach `math3d.org` to the app, before the release below, whose deploy job requests that origin;
   - deploy the app with `VITE_SITE_ORIGIN=https://math3d.org` and `VITE_LEGACY_APP_BASE_URL=https://old.math3d.org`;
   - set the API's `APP_BASE_URL` to `https://math3d.org`;
   - start the `next` redirect.
3. Last, start the `www` redirect. Started any earlier, it would leave `www` and `math3d.org` redirecting to each other.

Step 2 cannot be atomic: `APP_BASE_URL` is a Heroku setting, and the rest is a deploy. The API answers credentialed requests only from `APP_BASE_URL`, and every request the app makes is credentialed, so for the minutes between the two every API request fails on the other host, loading a scene included.

Stopping a redirect means removing its route in Cloudflare. Redeploying an older release does not remove it.

To confirm on `next.math3d.org` before the cutover:

- Whether `Clear-Site-Data` removes a cached redirect in Safari at all.
- That Safari and Firefox do not keep a `301` sent with `no-store`. Until then, only Chrome is known to survive a later reversal of a redirect without looping.

## Consequences

- Every indexed legacy URL moves from `www` to `math3d.org`. Search engines follow the `301`s; expect weeks of reshuffling in results.
- Every browser pays one cold load of the app's assets after its first arrival through `www`, whether or not it held the cached `301`.
- Where the clear has no effect, as measured in Safari, a browser holding the cached `301` takes one extra redirect per visit until the entry expires.
- **Unsaved drafts made on `next.math3d.org` are lost.** They are in `localStorage`, which is per host, and `next` becomes a redirect. The renderer preference and dismissed banners reset the same way. Nothing in this decision carries them over.
- `www` links arrive as `?from_www=1` for good, and the app strips it on every such arrival.
- Anyone can make a browser request the clear route. It costs that visitor at most one cold load.
- Sessions survive the move: the session cookie belongs to the API host, which shares a registrable domain with `math3d.org`, and the CSRF cookie is set for `.math3d.org`.

## Alternatives considered

- **Keep `www` canonical.** No indexed URL changes and there is no cached `301` to get past. Rejected for the reasons under "Why `math3d.org`"; the cost of moving is paid once.
- **A Cloudflare redirect rule for `www`.** No code, but it cannot set `Cache-Control`, so to avoid caching another `301` it would have to be a `302`, a weaker signal to search engines. Adding a parameter to a query that may be empty also takes two rules.
- **A Cloudflare Snippet.** Does what the Worker does, but needs the Pro plan and lives in the dashboard. The Worker is in source control and tested.
- **Clear only where the app finds a cached redirect.** A `fetch` with `cache: "only-if-cached"` and `redirect: "manual"` detects one, which would spare other browsers the cold load and count the affected ones. Rejected because the detection is unreliable in both directions.[^probe]
- **`Clear-Site-Data` on every `from_www` response, from a Cloudflare response-header rule.** No app code, but every `www` bookmark and old link would cold-load the app on every visit, and the rule lives in the dashboard.
- **Serve the app on both hosts with a canonical link and no redirect.** Avoids the loop, but leaves each visitor's drafts and preferences split across two hosts permanently.
- **Wait for the cached `301` to expire.** Chrome's never does.
- **Clear the cache from the legacy site before the cutover.** `Clear-Site-Data` clears only the origin that sends it, and a browser holding the cached `301` never contacts `math3d.org`.

[^lifetime]: Chromium gives a `301` without freshness headers an unlimited lifetime, and WebKit one year (both read from source). The entry goes when the cache evicts it for space, the user clears browsing data, or the cache is reset.
[^test]: Measured on 2026-11-25 and 2026-11-26 with fresh profiles against a local server answering for `.localhost` hostnames over plain HTTP, with entries minutes old: Google Chrome 158 driven by Playwright, Firefox 155 headless, Safari 27.0.1 in a `safaridriver` automation window. Not tested: HTTPS, a reload on Chrome's error page.
[^nostore]: Confirmed in Chrome; Safari and Firefox are still to confirm (see "Cutover order").
[^csd]: `Clear-Site-Data: "cache"` needs a secure origin (HTTPS; `localhost` also qualifies) and is documented for Chrome, Safari 17 and later, and Firefox 138 and later (also 63 to 93). Chrome may go on serving some cached entries until the tab reloads.
[^safari]: The header had no effect on the page response or on a `fetch`. `.localhost` counts as a secure origin in WebKit's source, so plain HTTP is probably not the cause.
[^probe]: Measured in Chrome 158. Chromium keys a navigation started by another site separately, so the probe misses a `301` cached by a link click from a search result, though the clear removes it. It also reports a stale redirect, such as the `302` that `math3d.org` sends today.
[^traffic]: Cloudflare "Top hosts", a single reading on 2026-11-25 whose window was not noted: `www.math3d.org` 8.51k requests, `math3d.org` 1.34k, `next.math3d.org` 635, `old.math3d.org` 160.
