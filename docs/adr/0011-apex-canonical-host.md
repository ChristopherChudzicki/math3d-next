# 0011 — `math3d.org` as the canonical host

**Status:** Proposed

## Context

This app replaces the legacy site (math3d-react) on the main domain at the end of December 2026. Today the legacy site is at `www.math3d.org`, `math3d.org` redirects to it, and this app is at `next.math3d.org`. The move forces a choice the legacy site never made explicit: which of `www.math3d.org` and `math3d.org` is the real address.

Choosing `math3d.org` has a hazard:

- Until 2026-11-25 the redirect from `math3d.org` to `www` was a `301` with no `Cache-Control` or `Expires` header. Since then it is a `302`, which browsers do not reuse.
- Chrome keeps such a `301` with no expiry, and Safari for a year, without asking the server again; Firefox does not reuse it.[^lifetime] This ADR calls such a leftover entry **the cached `301`**.
- Once `www` redirects to `math3d.org`, a browser holding the cached `301` is sent to `www` by its own cache and back by the server until it shows an error: in Chrome 158, `ERR_TOO_MANY_REDIRECTS`, without ever asking the `math3d.org` server.[^test]
- Regular visitors who type `math3d.org` are the likeliest to still hold it, because the cache evicts what was used least recently.

## Decision

**`https://math3d.org` is the canonical host.** `www` and `next` redirect to it from a small Worker in this repo. The `www` redirect adds `?from_www=1`, so a browser holding the cached `301` reaches the app instead of looping. The first time a browser arrives that way, the app has it clear its HTTP cache for `math3d.org`, the cached `301` included.

| Host              | Today                         | After the cutover                                                |
| ----------------- | ----------------------------- | ---------------------------------------------------------------- |
| `math3d.org`      | Redirect to `www`             | This app                                                         |
| `www.math3d.org`  | The legacy site               | Redirect to `math3d.org`, same path and query, plus `from_www=1` |
| `next.math3d.org` | This app                      | Redirect to `math3d.org`, same path and query                    |
| `old.math3d.org`  | The legacy site, as `noindex` | The same, until it is retired                                    |

Why `math3d.org`:

- _Opinion (owner's):_ it is the cleaner address to post and say aloud, and much of this choice is preference.
- Some visitors already use it: about one request to `math3d.org` for every six to `www` (Cloudflare, 2026-11-25; a rough signal).[^traffic]

### The redirect Worker

One Worker, in this repo with its own `wrangler.jsonc`, answers every request to `www.math3d.org` and `next.math3d.org`:

- `301` to the same path and query on `math3d.org`; `308` for anything but `GET` and `HEAD`, so a request keeps its method.
- `Cache-Control: no-store` on every redirect. The `301` tells search engines the move is permanent; `no-store` keeps Chrome (and, to confirm, Safari and Firefox) from caching it, so a wrong redirect can be fixed on the server.
- From `www` only, it appends `from_www=1`; the app checks the name, not the value.
- It copies the path and query onto the constant host `math3d.org`; resolving the path as a URL instead would send `www.math3d.org//evil.example` off the site.
- Its routes name the two hosts exactly. A wildcard would catch the API's host.
- Each host is its own route, so the two redirects start and stop separately. Stopping one means removing its route in Cloudflare; redeploying an older release does not.

### Past the cached `301`

1. A browser holding the cached `301` is sent from `math3d.org/abc` to `www.math3d.org/abc` by its own cache.
2. The redirect Worker sends it to `math3d.org/abc?from_www=1`. The cache is keyed by the whole URL, so this one is not in it and the request reaches the app. **This step alone prevents the loop.**
3. On every arrival with `from_www`, the app removes it from the address bar with `history.replaceState`, before Sentry or the router reads the URL.
4. Once per browser, recorded by a `localStorage` flag, the app fetches `/app/clear-cache` in the background. That route of the app's Worker answers with `Clear-Site-Data: "cache"`: the browser drops its HTTP cache for `https://math3d.org`, the cached `301` for every path included. Cookies and `localStorage` are untouched.[^csd]

Step 4 only saves later visits a redirect through `www`, and can be removed at any time.

In local tests `Clear-Site-Data` cleared the cached `301` in Chrome but had no effect in Safari, cause unknown.[^test][^safari] Safari's entries expire by 2027-11-25, a year after the last one could have been cached.

### Rules

- **Every redirect on these hosts is `no-store` or has an explicit, short lifetime.**
- `from_www` stays for as long as `www` redirects. Without it a browser still holding the cached `301` gets the error page, Chrome's entry never expires, and nothing counts browsers that have not come back.
- _Opinion (owner's):_ the site is about ten years old. Dropping `from_www` would probably be fine after two years and surely after five; most likely it simply stays.
- `from_www` is removed in the browser only. A redirect that removed it would land on the cached `301` again.
- Every page has a `rel="canonical"` link without `from_www`. Otherwise search engines index the URL they were redirected to. For `/` it goes in the static `index.html`, because the app's Worker does not serve `/`.
- `/app/clear-cache` sends exactly `Clear-Site-Data: "cache"`, with `Cache-Control: no-store`; `"storage"` or `"*"` would erase every visitor's drafts.

### Cutover order

1. Ahead of time:
   - ship the `rel="canonical"` links;
   - add `https://math3d.org` to the API's `CORS_ALLOWED_ORIGINS`;
   - on `next.math3d.org`, confirm that Safari and Firefox do not keep a `301` sent with `no-store`, and whether `Clear-Site-Data` clears a cached redirect in Safari at all.
2. Together, within minutes of each other:
   - first, attach `math3d.org` to the app in place of its redirect to `www` (the release's deploy job requests that origin);
   - deploy the app with `VITE_SITE_ORIGIN=https://math3d.org` and `VITE_LEGACY_APP_BASE_URL=https://old.math3d.org`;
   - set the API's `APP_BASE_URL` to `https://math3d.org`;
   - start the `next` redirect.
3. Last, start the `www` redirect. Started any earlier, it would leave `www` and `math3d.org` redirecting to each other.

The second group cannot be atomic: `APP_BASE_URL` is a Heroku setting, and the rest is a deploy. Until both land, every API call, loading a scene included, fails on whichever host `APP_BASE_URL` does not name, because the API accepts credentialed requests only from that origin.

## Consequences

- Every indexed legacy URL moves from `www` to `math3d.org`. Search engines follow the `301`s; expect weeks of reshuffling in results.
- Every browser pays one cold load of the app's assets after its first arrival through `www`, whether or not it held the cached `301`.
- Where `Clear-Site-Data` has no effect, as in Safari, a browser holding the cached `301` takes one extra redirect per visit until the entry expires.
- **Unsaved drafts made on `next.math3d.org` are lost.** They are in `localStorage`, which is per host, and `next` becomes a redirect. The renderer preference and dismissed banners reset the same way. Nothing in this decision carries them over.
- Anyone can make a browser fetch `/app/clear-cache`; it costs that visitor at most one cold load.
- Sessions survive the move: the session cookie belongs to the API host, which shares a registrable domain with `math3d.org`, and the CSRF cookie is set for `.math3d.org`.

## Alternatives considered

- **Keep `www` canonical.** No indexed URL changes and there is no cached `301` to get past. Rejected for the reasons under "Why `math3d.org`"; the cost of moving is paid once.
- **A Cloudflare redirect rule for `www`.** No code, but it cannot set `Cache-Control`, so to avoid caching another `301` it would have to be a `302`, a weaker signal to search engines.
- **A Cloudflare Snippet.** Does what the Worker does, but needs the Pro plan and lives in the dashboard. The Worker is in source control and tested.
- **Clear only where a cached redirect is detected** (`fetch` with `cache: "only-if-cached"` and `redirect: "manual"`). It would spare other browsers the cold load, but the detection misses some entries and reports stale ones.[^probe]
- **`Clear-Site-Data` on every `from_www` response, from a Cloudflare response-header rule.** No app code, but every `www` bookmark and old link would cold-load the app on every visit, and the rule lives in the dashboard.
- **Serve the app on both hosts with a canonical link and no redirect.** Avoids the loop, but leaves each visitor's drafts and preferences split across two hosts permanently.
- **Wait for the cached `301` to expire.** Chrome's never does.
- **Clear the cache from the legacy site before the cutover.** `Clear-Site-Data` clears only the origin that sends it, and a browser holding the cached `301` never contacts `math3d.org`.

[^lifetime]: Chromium gives a `301` without freshness headers an unlimited lifetime, and WebKit one year (both read from source). The entry goes when the cache evicts it for space, the user clears browsing data, or the cache is reset.
[^test]: Measured on 2026-11-25 and 2026-11-26 with fresh profiles against a local server answering for `.localhost` hostnames over plain HTTP, with entries minutes old: Google Chrome 158 driven by Playwright, Firefox 155 headless, Safari 27.0.1 in a `safaridriver` automation window. Not tested: HTTPS, a reload on Chrome's error page.
[^csd]: `Clear-Site-Data: "cache"` needs a secure origin (HTTPS; `localhost` also qualifies) and is documented for Chrome, Safari 17 and later, and Firefox 138 and later (also 63 to 93). Chrome may go on serving some cached entries until the tab reloads.
[^safari]: The header had no effect on the page response or on a `fetch`. `.localhost` counts as a secure origin in WebKit's source, so plain HTTP is probably not the cause.
[^probe]: Chrome 158: it misses a `301` cached by a click from another site, which Chromium keys separately, and it reports stale redirects such as today's `302`.
[^traffic]: Cloudflare "Top hosts", a single reading whose window was not noted: `www.math3d.org` 8.51k requests, `math3d.org` 1.34k, `next.math3d.org` 635, `old.math3d.org` 160. A `www` visit is many requests and a `math3d.org` visit is one redirect, but bots inflate the `math3d.org` count.
