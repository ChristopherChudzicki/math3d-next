# 0005 — Exercising Google sign-in in local development

**Status:** Proposed

**Contents**

- [Context](#context)
- [Decision](#decision)
  - [What the manual test covers](#what-the-manual-test-covers)
  - [Why `localhost` needs CSRF off](#why-localhost-needs-csrf-off)
  - [The flag](#the-flag)
  - [Limits of the deviation](#limits-of-the-deviation)
  - [The Google client](#the-google-client)
  - [The work](#the-work)
- [Consequences](#consequences)
- [Alternatives considered](#alternatives-considered)

## Context

[ADR-0004](0004-oauth-only-authentication.md) puts sign-in behind Google's OAuth redirect flow. Google requires redirect URIs to use HTTPS (bare `localhost` excepted) and a TLD on the public suffix list.[^redirect-uri] Development's usual hostname, `math3d.localdev`, fails both. Day-to-day development and E2E sign in through the `dummy` provider and never reach Google. This ADR decides how to run the real Google flow by hand when needed.

## Decision

**For a manual Google test, move both servers to bare `localhost` and disable Django's CSRF middleware behind a development-only flag.** Nothing else changes: `math3d.localdev` stays the default, `dummy` stays how E2E and daily work sign in, and production is untouched.

### What the manual test covers

Per ADR-0004, E2E drives the provider-neutral part of the redirect flow through dummy, with the real cookie setup and CSRF enforced, and backend tests drive Google's callback — `state`, PKCE, the code exchange — against a stubbed token endpoint. What only a real Google sign-in exercises is Google itself:

- accepting our redirect URI, client and scopes,
- redeeming the code with `GOOGLE_CLIENT_SECRET` and the PKCE verifier,
- returning an ID token whose claims build the account.

The likeliest failures are a redirect URI that doesn't match the one registered (Google shows `redirect_uri_mismatch`) and a wrong client secret (the code exchange fails, and the SPA receives `?error=`).

### Why `localhost` needs CSRF off

Since Chrome 148, cookies are **bound to the port that set them**; the `Domain` attribute is the only way out.[^obc] `localhost` can't use it: it is a single-label name, so it counts as its own public suffix, and browsers ignore a `Domain` attribute set to a public suffix. With the SPA on `localhost:3000` and the API on `localhost:8000`, Django's `csrftoken` cookie belongs to `:8000` and JavaScript on `:3000` can't read it. So the SPA can't put the token in the form that starts sign-in (`provider/redirect`), and Django rejects that POST. Chrome's policies for reverting the change stopped working in Chrome 150.

**Only the CSRF token is affected.** `sessionid` is `HttpOnly` and only ever travels between the browser and `:8000`, and no other code reads a cookie from JavaScript. The redirect to Google, the callback, and every request after sign-in carry the session cookie unchanged; only requests that need the CSRF token are affected.

The main options: turn the check off, move the token out of the cookie, or leave `localhost` for HTTPS on a name math3d owns. Moving the token changes production to make local development work. HTTPS needs a reverse proxy, a local certificate authority, a second set of hostnames, and a new dependency in CI (see [Alternatives](#alternatives-considered)) — all to avoid a deviation in a control that is a second layer of defense here, not the main one.[^csrf-depth]

### The flag

```python
if ENV.DISABLE_CSRF:
    if IS_DEPLOYMENT:
        raise ImproperlyConfigured("DISABLE_CSRF must not be enabled on a deployment.")
    MIDDLEWARE.remove("django.middleware.csrf.CsrfViewMiddleware")
```

Two variables must both be wrong for this to reach a deployment, and `IS_DEPLOYMENT` defaults to `True`, so an unconfigured deploy is the safe one. The guard checks `IS_DEPLOYMENT` directly rather than a setting derived from it, like `SESSION_COOKIE_SECURE`, which would look like a second, independent check but isn't.[^flags] `.remove()` raises if the middleware is ever renamed, so the flag can't silently stop working.

Removing the middleware is Django's supported way to turn CSRF off, and it also stops the `csrftoken` cookie being set. The frontend must send a token only when it can read one — `packages/api` already does, and the form that starts sign-in follows the same rule.

### Limits of the deviation

- **It applies to the whole machine while on.** One backend container serves the main checkout and every worktree, so no local checkout enforces CSRF during a Google test. Acceptable for a brief, deliberate session: the session cookie is still `SameSite=Lax`, so another site's POST arrives signed out, and only pages served from `localhost` itself could forge a signed-in request.[^csrf-depth]
- **Views that opt in keep their protection.** `csrf_protect` applies the same check per view, so Django admin is unaffected.
- **CI never sets it**, so CI keeps testing the real setup: `math3d.localdev`, the domain cookie, full enforcement. Locally, the flag breaks the E2E suite, whose global setup expects a `csrftoken` cookie.
- **`.localdev` frontends stop working while it's on.** Development's CORS origins follow `APP_BASE_URL`, now `localhost`, so every `.localdev` frontend is CORS-blocked, anonymous reads included.
- **The backend test suite ignores it.** `webserver/main/test_settings.py` clears the flag along with the rest of the environment, so `pytest` exercises CSRF even while it's set in `.env`.

### The Google client

A **dev-only OAuth client** in the same Google Cloud project as production — separate so that dev changes never touch the client real users sign in through, same project because the consent screen and its branding are per project. It has one redirect URI, `http://localhost:8000/_allauth/google/login/callback/` (Google allows plain HTTP and a non-standard port for `localhost`), and its own client secret.

Worktrees need nothing extra. The callback is always on the shared backend at `:8000`, and each checkout's `callback_url` (ports 3000 and 3002–3009) is already accepted, since allauth checks it against `CSRF_TRUSTED_ORIGINS`.

### The work

- **`DISABLE_CSRF` in `webserver/main/env.py`,** and the guarded block above in `settings.py`.
- **The same flag passed to django-ninja's cookie auth** in `webserver/main/ninja_auth.py`. Ninja's `SessionAuth` runs its own CSRF check rather than reading `MIDDLEWARE`, so without this every authenticated write to the v1 API fails with `{"detail": "CSRF check Failed"}`.
- **A short `README.md` section** with the `.env` block, the dev client's redirect URI, and what to expect; CLAUDE.md's E2E notes point to it.

No new service, no compose change, no CI change. The block is:

```sh
APP_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_ORIGIN=http://localhost:3000
CSRF_COOKIE_DOMAIN=
DISABLE_CSRF=True
VITE_DISPLAY_AUTH_FLOWS=true
GOOGLE_CLIENT_ID=<dev client id>
GOOGLE_CLIENT_SECRET=<dev client secret>
```

followed by `docker compose up -d` to recreate the backend (a container's environment is fixed at creation) and a dev-server restart. `localhost` is already in development's `ALLOWED_HOSTS`, and an empty `CSRF_COOKIE_DOMAIN` leaves Django's default, so nothing else needs a special case.[^localhost-free] Delete the block and recreate to switch back.

## Consequences

- **Google sign-in can be tested end to end on a laptop.** It stays a manual test: nothing automated talks to Google.
- **Switching is a `.env` block and a container recreate,** both ways, with nothing to install.
- **No local checkout enforces CSRF while the flag is on.** Fine for a brief, deliberate session; not if it's left on, and nothing detects that.
- **The dev client's ID and secret live in the gitignored `.env`,** because the secret is a credential. A developer running this test gets both from the Google console.
- **Development still never exercises TLS,** `X-Forwarded-Proto`, or `SECURE_PROXY_SSL_HEADER`. Unchanged, and out of scope here.

## Alternatives considered

- **HTTPS on a name math3d owns** — `https://local.math3d.org:3000` and `https://api.local.math3d.org:8000`, with a certificate from a local CA and Caddy terminating TLS for Django. The highest-fidelity option: cookies, scheme and proxy setup all match production, and it exercises `SECURE_PROXY_SSL_HEADER` locally. Rejected on ongoing cost: a reverse proxy in every stack, a per-machine CA whose certificate expires silently after about two years, a second hostname set that can't coexist with the first (`CSRF_COOKIE_DOMAIN` is one global value), and `mkcert` in CI on every PR to keep it from rotting. That is a lot of permanent surface for something needed a few times a year.[^https-design]
- **Move the CSRF token out of the cookie,** into a dedicated endpoint or `CSRF_USE_SESSIONS`. Rejected: it changes every authenticated write in production to make one local configuration work.
- **Test on a deployed instance.** `next.math3d.org` has real HTTPS, a real client and the real cookie setup, but it is the live instance, not staging, so the first real sign-in would happen in production. An RC instance is closer than it looks — `release-rc.yml` and an `rc` environment exist, and Heroku bills by the second — but it still needs hosting set up, and every iteration is a deploy with no debugger. Worth revisiting if an RC instance appears for other reasons.
- **A tunnel (`cloudflared`, `ngrok`).** A trusted certificate with nothing to install, reachable from a phone.[^cf-tunnel] Rejected: every request (HMR included) goes through the edge, the dev server becomes internet-reachable unless protected, each worktree port needs its own hostname, and a quick tunnel's hostname changes every session, so it must be re-registered with Google each time. Use this if a device that can't install a root certificate needs access.
- **Guard the flag on `SESSION_COOKIE_SECURE`.** Rejected: it looks like a second check and isn't.[^flags]
- **A dev-only Django page that renders the sign-in form with `{% csrf_token %}`.** Only the POST that starts sign-in needs a token JavaScript can read, so this would let the Google test run with CSRF on. Rejected for the same reason as the next option — repo-owned security code — and because the resumed save after sign-in still needs a token.
- **A dev-only middleware that skips CSRF only for loopback requests,** leaving `.localdev` protected even with the flag on. Tighter, and safe in production, whose `ALLOWED_HOSTS` rejects a `localhost` Host header first. Rejected because hand-written host matching is a security control the repo would then own, which is worse than a deviation limited to a deliberate session on one machine.

[^redirect-uri]: [Google — Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server): "Redirect URIs must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule", and "Host TLDs (Top Level Domains) must belong to the public suffix list."
[^obc]: [Chrome Platform Status — Origin-Bound cookies (by default)](https://chromestatus.com/feature/4945698250293248): from Chrome 148, cookies are bound to the origin that set them unless a `Domain` attribute relaxes host and port binding; the temporary opt-out policies "will stop working in Chrome 150". Chrome 148 reached stable on 2026-05-05. The [explainer](https://github.com/sbingler/Origin-Bound-Cookies/blob/main/README.md) confirms domain cookies are readable from any port. Scheme binding has no opt-out, so an HTTPS SPA with a plain-HTTP API isn't a halfway option.
[^csrf-depth]: Neither cookie sets `SameSite`, so Django's `Lax` default applies: a cross-site POST carries no `sessionid`, and JSON requests need a preflight the attacker's origin fails. What the token adds is protection from same-site attackers (`CSRF_COOKIE_DOMAIN` covers every `math3d.org` subdomain) and from handlers that parse a body without checking its content type. None of that applies to `localhost` on one developer's machine.
[^flags]: `SESSION_COOKIE_SECURE` has no input of its own: `settings.py` sets it `True`, then `False` when `IS_DEPLOYMENT` is false. Checking it is checking `IS_DEPLOYMENT` indirectly. The `DISABLE_ALLAUTH_RATE_LIMITS` guard checks `IS_DEPLOYMENT` the same way.
[^localhost-free]: Development's `ALLOWED_HOSTS` default in `webserver/main/settings.py` includes `localhost`; development CORS and CSRF-trusted origins are computed from `APP_BASE_URL` in `webserver/main/origins.py`; `settings.py` applies `CSRF_COOKIE_DOMAIN` only when non-empty; and `EnvConfig._csrf_cookie_domain_must_cover_spa_host` skips its check when it's empty.
[^cf-tunnel]: [Cloudflare — Create a locally-managed tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/).
[^https-design]: If revisited (on macOS): hostnames in a marked `/etc/hosts` block rather than public DNS (some resolvers' DNS-rebinding protection drops public records pointing at loopback); an `mkcert` CA with its root key deleted after issuing one certificate covering both hostnames, stored machine-wide; Vite terminating its own TLS and Caddy terminating for Django, mirroring production's split. Shared loopback domains (`lvh.me`, `localtest.me`, `nip.io`, `localhost.direct`) were rejected for the same reason as bare `localhost` — math3d doesn't own them — and `localhost.direct` publishes its private key.
