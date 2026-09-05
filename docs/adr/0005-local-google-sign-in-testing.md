# 0005 — Exercising Google sign-in in local development

**Status:** Accepted (2026-09-05)

**Contents**

- [Context](#context)
- [Decision](#decision)
  - [What the manual test has to reach](#what-the-manual-test-has-to-reach)
  - [Why `localhost` needs CSRF off](#why-localhost-needs-csrf-off)
  - [The flag](#the-flag)
  - [The bounds of the deviation](#the-bounds-of-the-deviation)
  - [The Google client](#the-google-client)
  - [The work](#the-work)
- [Consequences](#consequences)
- [Alternatives considered](#alternatives-considered)

## Context

[ADR-0004](0004-oauth-only-authentication.md) put sign-in behind Google and recorded that the flow cannot be exercised on the hostnames development uses: Google requires the host's TLD to be on the public suffix list and requires HTTPS outside bare `localhost`,[^origins] so `http://api.math3d.localdev:8000` fails on both counts. It named the two ways to run the real flow locally — both servers onto `localhost`, or TLS terminated locally for a domain math3d owns — and picked neither, because it did not have to: ordinary development authenticates through the `dummy` provider and never reaches Google. This ADR picks.

The constraints are identical under a redirect flow,[^redirect-uri] so a later popup-to-redirect migration does not reopen the choice.

Throughout, the machine is macOS, and the Google integration referred to lands with ADR-0004's implementation rather than its ADR.[^provenance]

## Decision

**Both servers move to bare `localhost` for the manual Google test, with Django's CSRF middleware disabled behind a development-only flag.** Nothing else moves: `math3d.localdev` stays the committed default, `dummy` stays how the E2E suite and daily work authenticate, and no production behaviour changes.

### What the manual test has to reach

A hand-run on `localhost` gets as far as the account chooser, and Google returns a credential to the browser. The POST that carries it to the API is then rejected. So the client half of the integration is already demonstrated, and the half that has never run is everything behind `provider/token`:

```python
return jwtkit.verify_and_decode(
    credential=credential, keys_url=CERTS_URL, issuer=ID_TOKEN_ISSUER,
    audience=app.client_id, ...)
```

The JWKS fetch, the signature check, the issuer check, and `audience=app.client_id` — followed by `sociallogin_from_response`, `SocialAccount` creation, and session issuance. `CsrfViewMiddleware` rejects in `process_view`, so none of it runs.

That is the entire payload of this ADR. The likeliest failure it would catch is a `GOOGLE_CLIENT_ID` that disagrees with `VITE_GOOGLE_CLIENT_ID` — rejected as `client_id_mismatch`, and invisible from the frontend because the two are different variables with different defaults. Everything else the flow touches is already machine-tested: the E2E suite drives the same `provider/token` view through `dummy` on every CI run, with the real cookie topology and CSRF fully enforced.

### Why `localhost` needs CSRF off

Chrome 148 made cookies **origin-bound by default**: a cookie is bound to the port that set it, and the `Domain` attribute is the sanctioned opt-out.[^obc] `localhost` cannot take that opt-out. It is a single label, so the public suffix list's prevailing `*` rule makes it its own public suffix, and a `Domain` attribute equal to a public suffix is discarded and the cookie stored host-only. With the SPA on `localhost:3000` and the API on `localhost:8000`, Django's `csrftoken` is set on `:8000`, returned to `:8000`, and invisible to `document.cookie` on `:3000`: `getCsrfToken()` in `packages/api/src/hooks/util.ts` yields the empty string, the client omits `X-CSRFToken`, and Django answers `CSRF token missing.` Nothing can be configured around it — the enterprise policies Chrome shipped to revert the change stopped working in Chrome 150, which stable passed in mid-2026.

**Only the CSRF token is affected.** `sessionid` is `HttpOnly`, set by the API and sent back to the API on its own port, so port binding never touches it, and no other code reads a cookie from JavaScript. The sign-in that follows, and every authenticated request after it, work on `localhost` unchanged.

So on `localhost` there are three options: disable the check, move the token out of the cookie, or leave `localhost` for HTTPS on a name math3d owns. The second changes production to enable local development. The third is a reverse proxy, a local certificate authority, a second hostname set, and a new dependency on every pull request — priced in full under [Alternatives](#alternatives-considered) — to avoid a deviation in a control that is defense in depth here, not the load-bearing one.[^csrf-depth]

### The flag

```python
if ENV.DISABLE_CSRF:
    if not IS_DEVELOPMENT:
        raise ImproperlyConfigured(
            "DISABLE_CSRF must not be enabled outside development."
        )
    MIDDLEWARE.remove("django.middleware.csrf.CsrfViewMiddleware")
```

Two variables must both be wrong for this to reach a real deployment, and production hardening is already the default: `IS_DEVELOPMENT` defaults to `False`, so an unconfigured deploy is the secure one. The guard names `IS_DEVELOPMENT` rather than a derived security setting — `SESSION_COOKIE_SECURE` would read as a second, independent signal and is not one.[^flags] `.remove()` rather than a filtered rebuild is deliberate: it raises `ValueError` if the middleware is ever renamed, so the toggle cannot silently become a no-op.

Django has no switch for this; dropping the middleware is the supported way, and it also stops the `csrftoken` cookie being set at all. The frontend needs no change — `csrfMiddleware` sets `X-CSRFToken` only when `getCsrfToken()` returns something.

### The bounds of the deviation

- **It is machine-wide while it is on.** One backend container serves the main checkout and every worktree, so during a Google session no local checkout enforces CSRF. Acceptable because there is no attacker on the laptop, and because the flag is set deliberately and briefly.
- **Views that opt in keep their protection.** `csrf_protect` applies the same middleware per-view, so Django admin — routed at `admin/`, and wrapped by `admin.site.admin_view` — is unaffected.
- **CI and the E2E suite never set it.** Both keep `math3d.localdev`, the domain cookie, and full enforcement, which is what keeps the cookie topology machine-tested while this flag exists.

### The Google client

A **dev-only OAuth client**, in the same Google Cloud project as production. Separate client because development origins churn, and every such edit would otherwise touch the client real users authenticate against; same project because the consent screen, its branding, and its publishing status are per-project. The authorized JavaScript origin is `http://localhost:3000` — plain HTTP and a non-standard port are both permitted for `localhost`[^origins] — with `:3002`–`:3009` added only if the test is ever run from a worktree. No redirect URI and no client secret, per ADR-0004: the popup flow obtains no authorization code, so neither field has a consumer.

### The work

- **`DISABLE_CSRF` in `webserver/main/env.py`,** and the guarded branch above in `settings.py`.
- **`README.md` gains a short section** with the `.env` block and what to expect.

Nothing else: no new service, no compose change, no CI change, no frontend change. The block is

```sh
APP_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_ORIGIN=http://localhost:3000
CSRF_COOKIE_DOMAIN=
DISABLE_CSRF=True
VITE_DISPLAY_AUTH_FLOWS=true
GOOGLE_CLIENT_ID=<dev client>
VITE_GOOGLE_CLIENT_ID=<dev client>
```

followed by `docker compose up -d` to recreate the backend — a container's environment is fixed at creation — and a Vite restart. `localhost` is already in the development `ALLOWED_HOSTS` default, and an empty `CSRF_COOKIE_DOMAIN` leaves Django's `None`, so no other setting needs a special case.[^localhost-free] Deleting the block and recreating reverts it.

## Consequences

- **The server half of Google sign-in becomes testable for the first time,** which is the whole point. It stays a manual test: nothing automated exercises Google in any configuration, and this ADR does not change that.
- **The switch is a `.env` block and a container recreate,** in both directions, with no per-machine setup, no certificate, and nothing to install.
- **No local checkout enforces CSRF while the flag is on.** Tolerable at the scale of a deliberate, brief session; it would not be if the flag were ever left on, and nothing detects that.
- **The dev client ID lives in `.env`, not in `.env.development`,** since the committed default never reaches Google. A developer wanting to run this test needs the ID from the Google console, and both variables set.[^client-id]
- **Development still never exercises TLS,** `X-Forwarded-Proto`, or `SECURE_PROXY_SSL_HEADER` — unchanged from today, and unaddressed here.
- **ADR-0004 opened production registration partly because the Google flow could not run locally.** It can now. Whether `ENABLE_REGISTRATION` should close again is a separate decision this ADR does not make.

## Alternatives considered

- **HTTPS on a name math3d owns** — `https://local.math3d.org:3000` and `https://api.local.math3d.org:8000`, on a certificate from a local CA, with Caddy terminating for Django and Vite for itself. The high-fidelity option, and the one this ADR accepted in an earlier revision. It buys a development environment whose cookies, scheme, and proxy topology all match production, and it is the only option that exercises `SECURE_PROXY_SSL_HEADER` outside production. Rejected on standing complexity: a reverse proxy in every stack, a certificate authority per machine whose leaf expires silently about two years out, a second hostname set that is mutually exclusive with the first because `CSRF_COOKIE_DOMAIN` is one process-global value, and — to keep a rarely-used path from rotting — `mkcert` and `libnss3-tools` on the critical path of every pull request. That is a large permanent surface for a capability wanted a few times a year, and it does not buy the CSRF-branch coverage it first appeared to.[^https-design]
- **Move the CSRF token out of the cookie,** to a dedicated endpoint or `CSRF_USE_SESSIONS`. Rejected: it changes how every authenticated write works in production so that one local configuration can exist.
- **Hand-test on a deployed instance instead.** `next.math3d.org` has real HTTPS, a real client, and the real cookie topology — but it is the live instance, not a staging one, so this means first-exercising sign-in in production on the same change that opens registration. A dedicated RC instance is closer than it looks: `release-rc.yml` and an `rc` deploy environment already exist, and Heroku bills by the second, so the cost is an hour of use rather than a subscription. It still needs hosting stood up, and each iteration costs a deploy with no way to attach a debugger. Worth revisiting if an RC instance appears for other reasons.
- **A tunnel (`cloudflared`, `ngrok`).** A trusted certificate with no local CA and no trust install, reachable from a phone, on infrastructure math3d already uses.[^cf-tunnel] Rejected because every request including HMR round-trips the edge, the dev server becomes internet-reachable absent Access, each worktree port needs its own hostname and ingress rule, and ephemeral hostnames need re-registering as a Google origin each session. Reach for this if a device that cannot install a root certificate needs in.
- **Guard the flag on `SESSION_COOKIE_SECURE`,** matching the existing `DISABLE_ALLAUTH_RATE_LIMITS` check. Rejected: it reads as a second signal and is not one.[^flags]
- **A development-only middleware exempting only loopback requests,** leaving `.localdev` enforced even while the flag is on. Tighter, and structurally safe — production's `ALLOWED_HOSTS` would reject a `localhost` Host header before the condition could be evaluated. Rejected because hand-written host matching is a security control this repo would then own and maintain, which is a worse trade than a deviation already bounded to a deliberate session on one machine.

[^obc]: [Chrome Platform Status — Origin-Bound cookies (by default)](https://chromestatus.com/feature/4945698250293248): "In Chrome 148, cookies are bound to their setting origin (by default) such that they're only accessible by that origin… Cookies might ease the host and port binding restrictions through use of the `Domain` attribute but all cookies will be bound to their setting scheme." The temporary `LegacyCookieScopeEnabled` and `LegacyCookieScopeEnabledForDomainList` policies "will stop working in Chrome 150"; Chrome 148 reached stable on 2026-05-05. The [explainer](https://github.com/sbingler/Origin-Bound-Cookies/blob/main/README.md) states that domain cookies "are allowed to be accessed by any port". Scheme binding has no `Domain` opt-out, which is why an HTTPS SPA with a plain-HTTP API is not a halfway option.
[^csrf-depth]: Neither cookie sets a SameSite value, so Django's `Lax` default applies to both — a cross-site POST carries no `sessionid` at all — and the JSON content type forces a preflight the attacker's origin fails. CORS itself is not the defense: it gates reading the response, not sending the request. What the token still covers is same-site attackers, since SameSite is site-scoped and `CSRF_COOKIE_DOMAIN` widens the cookie to every `math3d.org` subdomain, plus any handler that parses a body without checking its content type. None of that applies to a `localhost` origin on one developer's machine.
[^flags]: `SESSION_COOKIE_SECURE` has no environment input: `settings.py` sets it `True` and then forces it back to `False` inside the `else:` of `if not IS_DEVELOPMENT:`. Testing it is therefore testing `IS_DEVELOPMENT`, written obliquely and far from where it is computed. The same applies to the `DISABLE_ALLAUTH_RATE_LIMITS` guard as it stands, whose error message promises more than its condition delivers.
[^localhost-free]: The development `ALLOWED_HOSTS` default in `webserver/main/settings.py` already lists `localhost`; the development CORS origins are computed from `APP_BASE_URL` in `webserver/main/origins.py`, with the CSRF-trusted and credentialed sets derived from those; `settings.py` applies `CSRF_COOKIE_DOMAIN` only when non-empty; and `EnvConfig._csrf_cookie_domain_must_cover_spa_host` skips its check when it is empty.
[^client-id]: A client ID is public by construction, and its only security property is the origin allowlist, whose entries all resolve to loopback — so keeping it out of the repository is a matter of it being unused there, not of secrecy. The backend's `GOOGLE_CLIENT_ID` has no development default, and a mismatch with `VITE_GOOGLE_CLIENT_ID` is rejected as `client_id_mismatch`.
[^https-design]:
    The design, if it is ever revisited: names in a marker-delimited `/etc/hosts` block rather than public DNS records, which resolve the same names with nothing to install but are dropped by DNS-rebinding protection in some resolvers and put a production zone in local development's path; a `mkcert` CA with its root key deleted after issuance, rather than Let's Encrypt over DNS-01 (the whole ACME apparatus for a host answering only to loopback), Caddy's own `tls internal` (leaves are per-SNI inside Caddy's PKI, not files Vite can be handed), `vite-plugin-mkcert` (SPA only), or a name-constrained CA (mkcert cannot generate one); one leaf covering both hostnames and therefore every port, machine-global under `~/.local/share/math3d/certs/`; Vite terminating its own TLS and Caddy terminating for Django, mirroring production's split rather than proxying the API through Vite (which would collapse the origin split this project deliberately mirrors) or putting the SPA behind Caddy too. Shared loopback domains — `lvh.me`, `localtest.me`, `nip.io`/`sslip.io`, `localhost.direct` — were rejected for the same reason as bare `localhost`, no ownership, and in the last case because it publishes its private key. The claim that moving CI to HTTPS would newly cover Django's strict `Referer` check was wrong: that branch runs only under `elif request.is_secure():`, i.e. when `Origin` is absent, and browser requests always send it. The requests that would reach it are the E2E suite's Node-side `apiFetch` calls, which send neither header and would be rejected.
    [^origins]: [Google Cloud — Manage OAuth Clients](https://support.google.com/cloud/answer/15549257), on authorized JavaScript origins: the TLD must be on the public suffix list, HTTPS is required outside `localhost`, and "if you use a port other than 80, you must specify it. For example: `https://example.com:8080`".
    [^redirect-uri]: [Google — Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server): "Redirect URIs must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule", and "Host TLDs (Top Level Domains) must belong to the public suffix list."
    [^cf-tunnel]: [Cloudflare — Create a locally-managed tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/).
    [^provenance]: The `VITE_GOOGLE_CLIENT_ID` build variable, the `dummy` provider the E2E suite authenticates through, and the `provider/token` endpoint are not greppable in a tree carrying only the ADRs.
