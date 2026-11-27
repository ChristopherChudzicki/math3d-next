# 0011 — `www.math3d.org` stays the canonical host

**Status:** Proposed

## Context

This app replaces the legacy site (math3d-react) on the main domain at the end of December 2026. Today the legacy site is at `www.math3d.org`, `math3d.org` redirects to it, and this app is at `next.math3d.org`. The move is the moment to choose which of `www.math3d.org` and `math3d.org` is the real address, and moving to `math3d.org` has now been considered twice.

Moving to `math3d.org` would mean reversing a redirect that browsers have cached:

- Until 2026-11-25 the redirect from `math3d.org` to `www` was a `301` with no `Cache-Control` or `Expires` header. Since then it is a `302`, which browsers do not reuse.
- Chrome keeps such a `301` with no expiry, and Safari for a year, without asking the server again; Firefox does not reuse it.[^lifetime] This ADR calls such a leftover entry **the cached `301`**.
- If `www` redirected to `math3d.org`, a browser holding the cached `301` would be sent to `www` by its own cache and back by the server until it showed an error: in Chrome 158, `ERR_TOO_MANY_REDIRECTS`, without ever asking the `math3d.org` server.[^test]
- Regular visitors who type `math3d.org` are the likeliest to still hold it, because the cache evicts what was used least recently.

## Decision

**`https://www.math3d.org` stays the canonical host.** `math3d.org` and `next.math3d.org` redirect to it with a `301` that carries an explicit lifetime. Making `math3d.org` canonical is rejected; see "Why not `math3d.org`".

| Host              | Today                         | After the cutover                      |
| ----------------- | ----------------------------- | -------------------------------------- |
| `www.math3d.org`  | The legacy site               | This app                               |
| `math3d.org`      | Redirect to `www`             | Redirect to `www`, same path and query |
| `next.math3d.org` | This app                      | Redirect to `www`, same path and query |
| `old.math3d.org`  | The legacy site, as `noindex` | The same, until it is retired          |

### Rules

- **No redirect on these hosts is a `301` without an explicit lifetime.** A `302`, or a `301` with `Cache-Control`, can be changed on the server later; a `301` without one cannot, which is what made this decision expensive to reverse.
- Every page has a `rel="canonical"` link on `www.math3d.org`. For `/` it goes in the static `index.html`, because the app's Worker does not serve `/`.

### The redirect Worker

One Worker, in this repo with its own `wrangler.jsonc`, answers every request to `math3d.org` and `next.math3d.org`. A Cloudflare redirect rule cannot set `Cache-Control`, which is why this is a Worker.

- `301` to the same path and query on `www.math3d.org`; `308` for anything but `GET` and `HEAD`, so a request keeps its method.
- `Cache-Control: max-age=2592000` (30 days) on every redirect. The `301` tells search engines the move is permanent; the lifetime means every browser asks again within a month, so the direction can still be changed on the server.
- The `next` redirect starts at `max-age=3600` and moves to 30 days once the cutover has settled, so rolling the cutover back does not leave browsers redirected for a month.
- It copies the path and query onto the constant host `www.math3d.org`; resolving the path as a URL instead would send `math3d.org//evil.example` off the site.
- Its routes name the two hosts exactly. A wildcard would catch the API's host.
- Each host is its own route, so the two redirects start and stop separately.

### Cutover order

1. Ahead of time:
   - ship the `rel="canonical"` links;
   - add `https://www.math3d.org` to the API's `CORS_ALLOWED_ORIGINS`;
   - deploy the redirect Worker and give it `math3d.org` in place of today's `302`. The direction does not change, so this needs no coordination.
2. Together, within minutes of each other:
   - first, point `www.math3d.org` at the app in place of the legacy site (the release's deploy job requests that origin);
   - deploy the app with `VITE_SITE_ORIGIN=https://www.math3d.org` and `VITE_LEGACY_APP_BASE_URL=https://old.math3d.org`;
   - set the API's `APP_BASE_URL` to `https://www.math3d.org`;
   - start the `next` redirect.

The second group cannot be atomic: `APP_BASE_URL` is a Heroku setting, and the rest is a deploy. Until both land, every API call, loading a scene included, fails on whichever host `APP_BASE_URL` does not name, because the API accepts credentialed requests only from that origin.

## Why not `math3d.org`

`math3d.org` already works as an address to type, post and say aloud, because it redirects. Making it canonical buys only a shorter address when one is copied from the address bar, and one redirect fewer for those who arrive at `math3d.org`: about one request for every six to `www` (Cloudflare, 2026-11-25; a rough signal).[^traffic]

What it costs is a workaround for the cached `301`, which was designed and measured before being rejected:

- The `www` redirect would append `?from_www=1`. The cache is keyed by the whole URL, so that URL is not in it and the request reaches the app, which removes the parameter with `history.replaceState`. This worked in Chrome 158 and Safari 27.[^test]
- The parameter would have to stay for as long as `www` redirects: Chrome's entry never expires, and nothing counts browsers that have not come back.
- Clearing the entry with `Clear-Site-Data: "cache"` worked in Chrome and had no effect in Safari, cause unknown.[^test] Detecting which browsers hold it (`fetch` with `cache: "only-if-cached"`) misses some entries.[^probe]
- A failure is an error page drawn by the browser before any request reaches a server, so it cannot be logged, counted or alerted on.
- No public account was found of a site that reversed a cached redirect this way.

_Opinion (owner's):_ complicated, potentially dangerous, hard to monitor, and mostly unnecessary.

## Consequences

- No indexed legacy URL changes host, and a browser holding the cached `301` keeps working.
- **Unsaved drafts made on `next.math3d.org` are lost.** They are in `localStorage`, which is per host, and `next` becomes a redirect. The renderer preference and dismissed banners reset the same way. Nothing in this decision carries them over.
- Sessions survive the move: the session cookie belongs to the API host, which shares a registrable domain with `www.math3d.org`, and the CSRF cookie is set for `.math3d.org`.
- The legacy cached `301` remains in Chrome until the cache evicts it, so a later move to `math3d.org` meets the same problem in whatever browsers still hold it. The Worker's redirects add no entry that outlives 30 days.

## Alternatives considered

- **`math3d.org` as the canonical host.** See "Why not `math3d.org`".
- **Serve the app on both hosts with a canonical link and no redirect.** Leaves each visitor's drafts and preferences split across two hosts permanently.
- **Cloudflare redirect rules answering `302`,** as `math3d.org` does today. No code, but a weaker signal to search engines than a `301`.

[^lifetime]: Chromium gives a `301` without freshness headers an unlimited lifetime, and WebKit one year (both read from source). The entry goes when the cache evicts it for space, the user clears browsing data, or the cache is reset.
[^test]: Measured on 2026-11-25 and 2026-11-26 with fresh profiles against a local server answering for `.localhost` hostnames over plain HTTP, with entries minutes old: Google Chrome 158 driven by Playwright, Firefox 155 headless, Safari 27.0.1 in a `safaridriver` automation window. Not tested: HTTPS, real hostnames, a reload on Chrome's error page.
[^probe]: Chrome 158: it misses a `301` cached by a click from another site, which Chromium keys separately, and it reports stale redirects such as today's `302`.
[^traffic]: Cloudflare "Top hosts", a single reading whose window was not noted: `www.math3d.org` 8.51k requests, `math3d.org` 1.34k, `next.math3d.org` 635, `old.math3d.org` 160. A `www` visit is many requests and a `math3d.org` visit is one redirect, but bots inflate the `math3d.org` count.
