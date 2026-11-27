# 0011 — `math3d.org` as the canonical host

**Status:** Proposed

## Context

This app replaces the legacy site (math3d-react) on the main domain at the end of December 2026. Today the legacy site is at `www.math3d.org`, and `math3d.org` redirects to it. The move forces a choice the legacy site never made explicit: which of the two is the real address.

**The hazard.** Until 2026-11-25 the redirect from `math3d.org` to `www` was a `301` with no `Cache-Control` or `Expires` header. Chrome keeps such a redirect with no expiry, and Safari for a year, without asking the server again; Firefox does not reuse it.[^lifetime] Call that entry the cached `301`. Since 2026-11-25 the redirect is a `302`, which browsers do not keep, but the entries already cached remain.

Making `math3d.org` canonical means `www` redirects to it. A browser holding the cached `301` then goes back and forth between the two from its own cache and shows an error: in Chrome 158, `ERR_TOO_MANY_REDIRECTS`, with no request to `math3d.org` at all.[^test] Regular visitors who type `math3d.org` are the likeliest to still hold it, because the cache evicts what was used least recently.

## Decision

**`https://math3d.org` is the canonical host. `www` and `next` redirect to it from a small Worker in this repo, and the `www` redirect adds `?from_www=1`, which gets a browser past the cached `301`. The app then checks whether the browser holds it and, if so, clears it.**

Why `math3d.org`:

- It is the cleaner address to post and say aloud.
- Visitors already use it: in Cloudflare's per-host request counts it gets about one request for every six to `www`, and a visit to `www` is many requests where a visit to `math3d.org` is one redirect.[^traffic]
- _Opinion (owner's):_ a significant part of this is simple preference.

| Host              | Today                         | After the cutover                                      |
| ----------------- | ----------------------------- | ------------------------------------------------------ |
| `math3d.org`      | Redirect to `www`             | This app                                               |
| `www.math3d.org`  | The legacy site               | Redirect to `math3d.org`, same path, plus `from_www=1` |
| `next.math3d.org` | This app                      | Redirect to `math3d.org`, same path                    |
| `old.math3d.org`  | The legacy site, as `noindex` | The same, until it is retired                          |

### The redirect Worker

One Worker, in this repo with its own `wrangler.jsonc`, answers every request to `www.math3d.org` and `next.math3d.org`:

- `301` to the same path and query on `math3d.org`.
- **`Cache-Control: no-store` on every redirect.** The `301` tells search engines the move is permanent; `no-store` keeps browsers from caching it, so a wrong redirect can be fixed on the server.
- From `www` only, it sets the query parameter `from_www=1`. Only the name is read; the value is ignored.
- The target's host is the constant `math3d.org`, with the request's path and query copied onto it. Building the target by resolving the path as a URL would let `www.math3d.org//evil.example` redirect off the site.

### Past the cached `301`

1. A browser holding the cached `301` is sent from `math3d.org/abc` to `www.math3d.org/abc` by its own cache.
2. The redirect Worker sends it to `math3d.org/abc?from_www=1`. The cache is keyed by the whole URL, so this one is not in it and the request reaches the app. **This step alone prevents the loop.**
3. The app probes the clean URL with `fetch(url, { cache: "only-if-cached", mode: "same-origin", redirect: "manual" })`, which is answered from the cache or not at all. A response of type `opaqueredirect` means this browser holds the cached `301`.
4. Only then, the app:
   - fetches `/app/clear-cache`, a route of the app's Worker that answers with `Clear-Site-Data: "cache"`. The browser drops its HTTP cache for `https://math3d.org`, the cached `301` for every path included. Cookies and `localStorage` are untouched.[^csd]
   - refetches the clean URL with `cache: "reload"`, which replaces the cached `301` for that one URL where the header has no effect.
   - reports the event to Sentry, which makes it a count of browsers still affected.
5. The app removes `from_www` from the address bar with `history.replaceState`, before anything reads the URL to build a link.

Steps 3 and 4 only save later visits a redirect through `www`. A browser without the cached `301`, arriving by an ordinary `www` link or bookmark, clears nothing and keeps its cached assets.

Measured locally:[^test]

| Browser     | Reuses the cached `301`      | Probe finds it                              | Clear removes it for every path |
| ----------- | ---------------------------- | ------------------------------------------- | ------------------------------- |
| Chrome 158  | Yes                          | Yes                                         | Yes                             |
| Firefox 155 | No, it asks the server again | Yes, for a `301` with an explicit `max-age` | Yes, for the same               |
| Safari 27   | Yes                          | Yes                                         | No                              |

In Safari the header had no effect, on the page response or on a `fetch`. The test ran over plain HTTP, which may be why. The URL that was probed did load directly afterwards, even with step 4 switched off; that is unexplained and not relied on.

### How long this stays

- The redirect Worker stays for as long as `www` and `next` redirect.
- `from_www` and the probe stay until the count from step 4 has been zero for a year. No date alone makes removal safe: Chrome's cached `301` has no expiry, and removing the parameter gives a browser that still holds one an error page.
- Safari's entries expire by 2027-11-25, a year after the last one could have been cached.

### Rules for the cutover

- **Every redirect on these hosts is `no-store` or has an explicit, short lifetime.**
- Every page has a `rel="canonical"` link without `from_www` before the `www` redirect goes live. Otherwise search engines index the URL they were redirected to.
- `from_www` is removed in the browser only. A redirect that removed it would land on the cached `301` again.
- Order:
  1. Ahead of time, add `https://math3d.org` to the API's `CORS_ALLOWED_ORIGINS`.
  2. Together: deploy the app to `math3d.org` with `VITE_SITE_ORIGIN` set to it and `VITE_LEGACY_APP_BASE_URL` set to `https://old.math3d.org`, set the API's `APP_BASE_URL` to it, and start the `next` redirect.
  3. Last, start the `www` redirect. Started before step 2, `www` and `math3d.org` redirect to each other.
- The API accepts sign-in and writes from `APP_BASE_URL` only, and that is a Heroku setting while the rest is a deploy. For the minutes between them, saving and sign-in fail on whichever host is not `APP_BASE_URL`.

To confirm on `next.math3d.org` before the cutover:

- Over HTTPS, `Clear-Site-Data` removes a cached redirect in Safari. If it does not, Safari heals one URL at a time.
- Safari and Firefox do not keep a `301` sent with `no-store`. Until then, changing direction again is known to be safe in Chrome only.

## Consequences

- Every indexed legacy URL moves from `www` to `math3d.org`. Search engines follow the `301`s; expect weeks of reshuffling in results.
- A browser holding the cached `301` pays one extra redirect and one cold load of the app's assets, once. In Safari, if the header has no effect, it pays the redirect once for each path it had cached and no cold load.
- **Unsaved drafts made on `next.math3d.org` are lost.** They are in `localStorage`, which is per host, and `next` becomes a redirect. The renderer preference and dismissed banners reset the same way. Nothing in this decision carries them over.
- The clear route's header must stay exactly `"cache"`: `"storage"` or `"*"` would erase every visitor's drafts.
- Anyone can make a browser request the clear route. It costs that visitor one cold load.
- Sessions survive the move: the session cookie belongs to the API host, which shares a registrable domain with `math3d.org`, and the CSRF cookie is set for `.math3d.org`.

## Alternatives considered

- **Keep `www` canonical.** No indexed URL changes and there is no cached `301` to get past. Rejected for the reasons under "Why `math3d.org`"; the cost of moving is paid once.
- **A Cloudflare redirect rule for `www`.** No code, but it has no setting for `Cache-Control`, so it would be a `302`, a weaker signal to search engines. Adding a parameter to a query that may be empty also takes two rules.
- **A Cloudflare Snippet.** Does what the Worker does, but needs the Pro plan and lives in the dashboard. The Worker is in source control and tested.
- **`Clear-Site-Data` on every `from_www` response, from a Cloudflare response-header rule.** No app code, but it empties the cache on every visit that arrives through `www`, so every `www` bookmark and old link cold-loads the app each time. The rule also lives in the dashboard.
- **Clear once per browser, remembered in `localStorage`.** Visitors who never held the cached `301` still pay one cold load, and it gives no count of those who did.
- **Serve the app on both hosts with a canonical link and no redirect.** Avoids the loop, but leaves each visitor's drafts and preferences split across two hosts permanently.
- **Wait for the cached `301` to expire.** Chrome's never does.
- **Clear the cache from the legacy site before the cutover.** `Clear-Site-Data` clears only the origin that sends it, and a browser holding the cached `301` never contacts `math3d.org`.

[^lifetime]: Chromium gives a `301` without freshness headers an unlimited lifetime, and WebKit one year (both read from source). The entry goes when the cache evicts it for space, the user clears browsing data, or the cache is reset.
[^test]: Measured on 2026-11-25 and 2026-11-26 with fresh profiles against a local server answering for two `.localhost` hostnames over plain HTTP, with entries minutes old: Google Chrome 158 driven by Playwright, Firefox 155 headless, Safari 27.0.1 in a `safaridriver` automation window. Not tested: HTTPS, a reload on Chrome's error page.
[^csd]: `Clear-Site-Data: "cache"` needs HTTPS and is documented for Chrome, Safari 17 and later, and Firefox 138 and later (also 63 to 93). Chrome may go on serving some cached entries until the tab reloads.
[^traffic]: Cloudflare "Top hosts", a single reading on 2026-11-25 whose window was not noted: `www.math3d.org` 8.51k requests, `math3d.org` 1.34k, `next.math3d.org` 635, `old.math3d.org` 160. Bots are included and inflate the `math3d.org` count.
