# 0005 — Local HTTPS development environment

**Status:** Accepted (2026-09-05)

**Contents**

- [Context](#context)
- [Decision](#decision)
  - [Names in /etc/hosts](#names-in-etchosts)
  - [A local CA](#a-local-ca)
  - [Terminating TLS](#terminating-tls)
  - [Configuration that moves](#configuration-that-moves)
  - [The Google client](#the-google-client)
  - [The CA private key](#the-ca-private-key)
  - [The work](#the-work)
- [Consequences](#consequences)
- [Alternatives considered](#alternatives-considered)

## Context

[ADR-0004](0004-oauth-only-authentication.md) put sign-in behind Google and recorded that the flow cannot be exercised on the hostnames development uses: Google requires the host's TLD to be on the public suffix list and requires HTTPS outside bare `localhost`,[^origins] so `http://api.math3d.localdev:8000` fails on both counts. It named the two ways to run the real flow locally — both servers onto `localhost`, or TLS terminated locally for a domain math3d owns — and picked neither, because it did not have to: ordinary development authenticates through the `dummy` provider and never reaches Google. This ADR picks.

The constraints are identical under a redirect flow,[^redirect-uri] so a later popup-to-redirect migration does not reopen the choice.

Bare `localhost` is the cheaper option by a wide margin — no infrastructure, no code, one origin registered in the Google console.[^localhost-free] It does not work. Chrome 148 made cookies **origin-bound by default**: a cookie is bound to the port that set it, and the `Domain` attribute is the sanctioned opt-out.[^obc] `localhost` cannot take that opt-out. It is a single label, so the public suffix list's prevailing `*` rule makes it its own public suffix, and a `Domain` attribute equal to a public suffix is discarded and the cookie stored host-only. With the SPA on `localhost:3000` and the API on `localhost:8000`, Django's `csrftoken` is therefore set on `:8000`, returned to `:8000`, and invisible to `document.cookie` on `:3000`: `getCsrfToken()` in `packages/api/src/hooks/util.ts` yields the empty string, the client omits `X-CSRFToken`, and Django answers `CSRF token missing.` The rejected request is the provider POST — the one a sign-in test exists to exercise.

Nothing can be configured around it. The temporary enterprise policies Chrome shipped to revert the change stopped working in Chrome 150, which stable passed in mid-2026.

That closes the chain. Google accepts only HTTPS or bare `localhost`; bare `localhost` cannot carry a domain cookie; the CSRF token must be a domain cookie to cross the split between the SPA's port and the API's. The only origin satisfying both Google and our cookie topology is HTTPS on a multi-label name math3d controls. Nor can it be half-done: origin binding also binds scheme, and scheme has no `Domain` opt-out,[^obc] so an HTTPS SPA and a plain-HTTP API would fail to share cookies even setting aside mixed-content blocking. Both ends terminate TLS or neither does.

Throughout, the machine is macOS, and the Google integration referred to lands with ADR-0004's implementation rather than its ADR.[^provenance]

## Decision

**Serve local development from `https://local.math3d.org:3000` (SPA) and `https://api.local.math3d.org:8000` (API), on a certificate from a CA installed in the developer's own trust store.** Because the hostnames live under a domain math3d owns,[^zone-names] this is a single environment rather than a mode: daily development, the E2E suite, and a hand-driven Google sign-in all run on it, and `math3d.localdev` retires from local use.[^localdev-residue]

```mermaid
flowchart TB
    subgraph host["Developer machine"]
        mkcert["mkcert (run once)"]
        store[("host trust store")]
        gone(["discarded"])
        certs[("~/.local/share/math3d/certs/")]
        browser["Browser"]
        vite["Vite :3000<br/>terminates TLS"]
        subgraph compose["docker compose"]
            caddy["Caddy<br/>host :8000, terminates TLS"]
            django["Django runserver<br/>container :8000, plain HTTP"]
        end
    end

    mkcert -->|"root cert"| store
    mkcert -->|"root key, after issuance"| gone
    mkcert -->|"leaf + key"| certs
    certs -.->|read| vite
    certs -.->|bind-mount| caddy
    browser -->|"https://local.math3d.org:3000<br/>/etc/hosts → 127.0.0.1"| vite
    browser -->|"https://api.local.math3d.org:8000<br/>/etc/hosts → 127.0.0.1"| caddy
    caddy -->|"http://webserver:8000<br/>service name, not public host"| django
```

Three questions follow: how the names resolve, who signs the certificate, and who terminates TLS.

### Names in /etc/hosts

`local.math3d.org` and `api.local.math3d.org` resolve to loopback from a marker-delimited block in `/etc/hosts`, written by the setup script — extending the block `README.md` already documents for `math3d.localdev`, and the same shape `ol-infrastructure/local-dev` maintains.[^ol-infra] Both names need `::1` lines alongside `127.0.0.1`.[^ipv6]

Records in the Cloudflare zone would resolve the same names with nothing to install, and owning the zone is what makes that available to us where `lvh.me` and `localtest.me` are the same trick on domains we do not control. They are rejected anyway. The `sudo` line they would save already exists, in `README.md` and again in the E2E workflow, so the saving is two lines in a block a new machine writes regardless; hosts entries are machine-global and carry no ports, so worktrees never touch them under either scheme; and a setup script is being written either way. Against that, a public name resolving to `127.0.0.1` is dropped by DNS-rebinding protection in some resolvers, consumer routers, and corporate VPNs — surfacing as NXDOMAIN for a name that demonstrably exists — and records put network reachability, and the state of a production DNS zone, in the path of local development. The one thing they uniquely enable is ACME DNS-01, which [A local CA](#a-local-ca) rejects on its own terms.

### A local CA

The certificate comes from a **mkcert CA installed in this machine's trust store**, not from a publicly trusted issuer:

```sh
mkcert -install   # once per machine; system keychain, admin prompt
mkcert -cert-file ~/.local/share/math3d/certs/local.math3d.org.pem \
       -key-file  ~/.local/share/math3d/certs/local.math3d.org-key.pem \
       local.math3d.org api.local.math3d.org
```

Let's Encrypt could issue over DNS-01 if the names were in the zone, but that buys the whole ACME apparatus for a host that only answers to loopback.[^acme]

One leaf covers both hostnames and therefore every port — ports are not part of a certificate — so the main checkout on `:3000` and worktree servers on `:3002`–`:3009` share it. It lives machine-global under `~/.local/share/math3d/certs/` rather than beside the code.[^certs-path]

### Terminating TLS

**Vite terminates its own TLS** via `server.https`. `packages/app/vite.config.ts` already parses `APP_BASE_URL` into an `appUrl` the `server` and `preview` blocks take host and port from, so the scheme joins them as a third derived value. Reading the certificate must be scoped to an https `APP_BASE_URL` and to `command === "serve"`: that file is also the vitest config, and `yarn test` and `yarn build` run in CI where no certificate exists.

Django gets a Caddy container, because `runserver` cannot terminate TLS and because production terminates at Heroku's router with Django reading `X-Forwarded-Proto` behind it. That makes `SECURE_PROXY_SSL_HEADER` — today production-only — necessary in development too. The consequence is about CSRF, not URL building: `CsrfViewMiddleware` composes its same-origin comparison from `request.is_secure()` and runs the strict `Referer` check _only_ for secure requests,[^csrf] so without the header development would exercise a different code path than production.

The Caddyfile matches on the public hostname and forwards to the Docker service name:

```
api.local.math3d.org:8000 {
    tls /certs/local.math3d.org.pem /certs/local.math3d.org-key.pem
    reverse_proxy webserver:8000
}
```

The service name is load-bearing: inside a container the public name still resolves to `127.0.0.1`, so `reverse_proxy api.local.math3d.org:8000` would proxy Caddy to itself. The same rule governs any server-side fetch from Django.

Caddy takes host `:8000` behind a compose profile, and `webserver`'s published port becomes `${WEBSERVER_HOST_PORT:-8000}` — the default unchanged, so a stack brought up without the profile still publishes Django where CI expects it. Enabling HTTPS sets both `COMPOSE_PROFILES` and `WEBSERVER_HOST_PORT=8001` in the **gitignored project-root `.env`**, the only file compose interpolation reads.[^compose-env]

### Configuration that moves

`.env.development` moves `APP_BASE_URL`, `VITE_API_BASE_URL`, `VITE_SITE_ORIGIN`, `TEST_APP_URL`, and `TEST_API_URL` to the new origins, and `CSRF_COOKIE_DOMAIN` to **`local.math3d.org`** — not `math3d.org`, which the validator would also accept while attaching development cookies to production requests. The CORS, CSRF-trusted, and credentialed origins in `webserver/main/origins.py` all trace back to `APP_BASE_URL`, so they follow for free, worktree ports included. One consumer does not: the development `ALLOWED_HOSTS` default in `webserver/main/settings.py` is `["localhost", "127.0.0.1", "api.math3d.localdev"]`, and Caddy preserves the incoming `Host`, so Django rejects every API request with `DisallowedHost` until `api.local.math3d.org` is added.

Trust does not follow the configuration either. **Node does not read the macOS trust store by default.** Playwright's `webServer` readiness probe, `global.setup.ts`'s `request.get`, and — the one no Playwright option reaches — the bare `fetch` calls in `packages/app-tests-e2e/src/utils/api/config.ts` all validate against Node's bundled CA bundle. The fix goes on the `test-e2e` script, which already wraps Playwright in a `node` invocation: either `NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"` or, on the pinned Node 24, `--use-system-ca`. `ignoreHTTPSErrors` is not the fix — it would discard the trust this design exists to establish. Playwright's Chromium needs nothing, but only because it reads the macOS keychain and is the suite's sole browser project.[^chromium]

CI stays on `.localdev` over HTTP throughout: it writes its own `.env` from Actions variables, so it is already insulated, and moving it would buy no coverage.[^ci-http]

### The Google client

A **dev-only OAuth client**, in the same Google Cloud project as production. Separate client because development origins churn, and every such edit would otherwise touch the client real users authenticate against. Same project because the consent screen, its branding, and its publishing status are per-project. Authorized JavaScript origins list `https://local.math3d.org:3000` and each of `:3002`–`:3009`; non-standard ports are permitted in a JavaScript origin,[^origins] so no privileged bind is needed and worktrees register on the same terms as the main checkout. No redirect URI and no client secret, per ADR-0004 — the popup flow obtains no authorization code, so neither field has a consumer.

### The CA private key

A trusted root's private key mints certificates for _any_ hostname this machine accepts silently. Live malware running as the user is game-over regardless; backup exposure — a stolen disk, a compromised backup provider — needs no code execution, and is the case worth designing against.

So the setup **deletes `rootCA-key.pem` once the leaf is issued**:

```sh
rm "$(mkcert -CAROOT)/rootCA-key.pem"
```

`rootCA.pem` stays put — in the trust store and on disk at `$(mkcert -CAROOT)`, the path `NODE_EXTRA_CA_CERTS` needs. Nothing sensitive on disk means nothing to exclude from backups and nothing to rotate. The cost is that issuance becomes one-shot: adding a third hostname later is a full CA rotation — new CA, re-trust, reissue — not another `mkcert` run. That is the same work the leaf's roughly two-year lifetime forces anyway.

### The work

- **A new `scripts/setup_local_https.sh`,** not an extension of `setup_worktree_env.sh`, which refuses to run outside a worktree. It creates the certs directory, writes the `/etc/hosts` block, runs the two `mkcert` commands above, and deletes the root key.
- **A human runs `mkcert -install` once per machine.** It writes to the system keychain and prompts for administrator credentials, so an agent cannot, and a fresh machine cannot `yarn start` until it happens. The certificate is machine-global, so worktrees created afterwards need nothing.
- **`just start` gains the compose profile** so Caddy comes up with the stack.
- **`README.md`'s hosts block and setup steps** move to the new names and gain the certificate step.
- **`scripts/setup_worktree_env.sh` needs two changes.** It writes the origin into each worktree's `.env` and refuses to overwrite an existing one, so worktrees created before the switch break rather than degrade — the backend no longer trusts their origin, and every authenticated request fails. Its claimed-port scan also matches the literal `math3d.localdev:[0-9]+`, which finds nothing once worktrees carry the new origin, so a regenerated worktree could be handed a port another already owns.
- **Development cookie flags stay `False`** even over TLS, and the `DISABLE_ALLAUTH_RATE_LIMITS` guard stays as it is.[^cookie-flags]
- **The dev client ID is committed to `.env.development`,** replacing the placeholder, so a fresh checkout gets a working button from the setup script alone.[^client-id]

## Consequences

- **One hostname set, used by everything.** Daily development, the E2E suite, and a real sign-in share an environment, so there is no mode to enter, no mode to leave, and no configuration that is correct for one activity and wrong for the next.
- **A fresh machine cannot start the app until a human runs `mkcert -install`.** The prompt for administrator credentials is unavoidable and not automatable, which makes it the one setup step an agent cannot perform on its own.
- **Worktrees created before the switch break rather than degrade.** `setup_worktree_env.sh` will not overwrite an existing `.env`, so their origins stay on `.localdev`, fall outside the backend's trusted set, and fail every authenticated request. Each needs its `.env` regenerated by hand.
- **The certificate expires silently, roughly two years out.** A missing certificate fails the dev server loudly; an expired one starts fine and fails only in the browser, with no reminder. Adding a third hostname before then is a full CA rotation rather than another `mkcert` run.
- **The E2E suite carries a CA reference permanently,** on the `test-e2e` script, for as long as any part of the suite reaches the API through Node rather than through Chromium.
- **Development starts exercising production's CSRF path.** `SECURE_PROXY_SSL_HEADER` becomes a development setting, so `request.is_secure()` is true and `CsrfViewMiddleware` takes the branch it takes in production — including the strict `Referer` check that plain-HTTP development skips entirely.
- **CI diverges from local development.** It stays on `.localdev` over HTTP, so the HTTPS path is exercised only on developer machines: a break in the certificate, in Caddy, or in the Vite TLS branch fails nowhere but locally.
- **The Google console holds ten origins outside the repo,** one per port, discoverable only by failing.
- **ADR-0004 opened production registration partly because the Google flow could not run locally.** It can now. Whether `ENABLE_REGISTRATION` should close again is a separate decision this ADR does not make.

## Alternatives considered

- **Bare `localhost` for both servers.** Free, and the option ADR-0004 named first. Rejected because it does not work: with cookies origin-bound by default since Chrome 148 and `Domain=localhost` unavailable, the SPA on `:3000` cannot read the CSRF token the API sets on `:8000`, and the sign-in POST is rejected.[^obc] There is no supported way to opt out — the enterprise policies expired in Chrome 150.
- **Disable CSRF in development,** as an env-guarded branch in `settings.py`, alongside the `localhost` origins. It would work: `getCsrfToken()` is the app's only `document.cookie` read, `sessionid` is host-only on the API's own port and travels fine, and allauth's headless views apply no CSRF enforcement of their own. Rejected on fidelity rather than danger — the token here is defense in depth, not the load-bearing control[^csrf-depth] — but the one manual Google test would then run on a `localhost` origin, with a host-only cookie instead of a domain cookie, with CSRF off: three deviations stacked in exactly the layer the test exists to inspect. What it would confirm is that Google returns an ID token and allauth accepts it, which the E2E suite already establishes through `dummy` on the same `provider/token` endpoint.
- **Move the CSRF token out of the cookie,** to a dedicated endpoint or `CSRF_USE_SESSIONS`. Rejected: it changes how every authenticated write works in production so that one local mode can exist. This design changes only local development.
- **Hand-test Google on a deployed instance instead.** `next.math3d.org` has real HTTPS, a real client, and the real cookie topology, and ADR-0004 already assumes as much. But it is the live instance, not a staging one, so this means first-exercising sign-in in production on the same change that opens registration — and a separate RC instance is $10–20 a month, recurring, against a one-time local build. Each iteration would also cost a deploy, with no way to attach a debugger.
- **A tunnel (`cloudflared`, `ngrok`).** The strongest infrastructure alternative — a trusted certificate, no local CA, no trust install, reachable from a phone, on infrastructure math3d already uses.[^cf-tunnel] Rejected because every request including HMR round-trips Cloudflare, the dev server becomes internet-reachable absent Access, each worktree port needs its own hostname and ingress rule, and TLS would terminate at an edge production does not have — `api.math3d.org` is a Heroku CNAME, not proxied. Ephemeral `ngrok` hostnames would also need re-registering as a Google origin each session. Reach for this if a device that cannot install a root certificate needs in.
- **Public DNS records instead of `/etc/hosts`.** Rejected; see [Names in /etc/hosts](#names-in-etchosts).
- **Proxy the API through Vite** (`server.proxy`) — one origin, one terminator, no Caddy. The standard Vite pattern, and the obvious simplification. Rejected because it collapses the SPA/API origin split, so `CSRF_COOKIE_DOMAIN`, the cross-origin CORS path, and the credentialed-origin machinery all stop being exercised in development — the very arrangement ADR-0004 has development mirroring from production, and the one whose breakage under `localhost` is why this ADR exists.
- **Put the SPA behind Caddy too,** for a single terminator, deleting Vite's certificate branch and its `command === "serve"` guard. Rejected because two terminators is the faithful mirror, not an accident: in production the browser reaches the SPA at a CDN and the API at `api.next.math3d.org`, terminated by Heroku's router and forwarded to the dyno internally.
- **Shared loopback domains** — `lvh.me`, `localtest.me`, `nip.io`/`sslip.io`,[^sslip] and `localhost.direct`,[^lhd] which publishes a publicly trusted wildcard certificate _and its private key_. Rejected for the same reason as bare `localhost` — no ownership, so no claim to be the single environment — plus: a published private key lets anyone on the same network MITM every `*.localhost.direct` host with a publicly trusted certificate.
- **Caddy's own local CA** (`tls internal` + `caddy trust`).[^caddy-internal] The same mechanism on a service already running. Rejected because leaves are generated per-SNI inside Caddy's PKI rather than as files Vite can be handed, and `caddy trust` installs into the trust store of wherever it runs — for a containerized Caddy, the container's — leaving the only hard step manual anyway.
- **`vite-plugin-mkcert`.**[^vite-mkcert] Rejected: it covers the SPA only, and manages a per-project certificate rather than the machine-global one Caddy also mounts.
- **A publicly trusted certificate via DNS-01.** Rejected; see [A local CA](#a-local-ca).
- **`runserver_plus --cert-file` (`django-extensions`).** No new service and no `SECURE_PROXY_SSL_HEADER` — which is the objection. Rejected because production runs Django behind a TLS-terminating router reading forwarded headers, and this diverges from that topology to save a container.
- **A name-constrained CA.** X.509 `nameConstraints` limiting the root to `.math3d.org` would reduce "can forge anything" to "can forge our own dev hostnames". Rejected: mkcert cannot generate one, and enforcement on user-added roots is unverified with a silent fallback. Deleting the private key addresses the same threat with no new tooling.

[^obc]: [Chrome Platform Status — Origin-Bound cookies (by default)](https://chromestatus.com/feature/4945698250293248): "In Chrome 148, cookies are bound to their setting origin (by default) such that they're only accessible by that origin… Cookies might ease the host and port binding restrictions through use of the `Domain` attribute but all cookies will be bound to their setting scheme." The temporary `LegacyCookieScopeEnabled` and `LegacyCookieScopeEnabledForDomainList` policies "will stop working in Chrome 150"; Chrome 148 reached stable on 2026-05-05. The [explainer](https://github.com/sbingler/Origin-Bound-Cookies/blob/main/README.md) states that domain cookies "are allowed to be accessed by any port".
[^csrf-depth]: Neither cookie sets a SameSite value, so Django's `Lax` default applies to both — a cross-site POST carries no `sessionid` at all — and the JSON content type forces a preflight the attacker's origin fails. CORS itself is not the defense: it gates reading the response, not sending the request. What the token still covers is same-site attackers, since SameSite is site-scoped and `CSRF_COOKIE_DOMAIN` widens the cookie to every `math3d.org` subdomain, plus any handler that parses a body without checking its content type.
[^localhost-free]: The development `ALLOWED_HOSTS` default in `webserver/main/settings.py` already lists `localhost`; the development CORS origins are computed from `APP_BASE_URL` in `webserver/main/origins.py`, with the CSRF-trusted and credentialed sets derived from those; and `EnvConfig._csrf_cookie_domain_must_cover_spa_host` skips its check when `CSRF_COOKIE_DOMAIN` is empty.
[^provenance]: The `VITE_GOOGLE_CLIENT_ID` build variable, the `dummy` provider the E2E suite authenticates through, and the `provider/token` endpoint are not greppable in a tree carrying only the ADRs. Trust-store mechanics are the part of this that would differ off macOS.
[^zone-names]: `local.` rather than `dev.` only because `dev` is likelier to be wanted for something deployed. Both need confirming unused in the zone, which already carries `math3d.org`, `next.math3d.org`, and `api.next.math3d.org` — a hosts entry shadows the zone rather than coordinating with it, but a collision would still surprise.
[^localdev-residue]: It does not disappear entirely: CI keeps it, and it survives in the backend tests, which pass their own origins in explicitly — so they keep passing; they just stop resembling the configuration they describe.
[^ol-infra]: `ol-infrastructure/local-dev` maintains a marker-delimited `/etc/hosts` block for its `mit.dev` names; a hosts file has no wildcards, so its eight hostnames are enumerated by hand, as the two here would be.
[^ipv6]: Today's block carries `::1` lines for both `.localdev` names, and `scripts/setup_worktree_env.sh` probes both loopbacks on the stated grounds that dev servers commonly bind only `::1`.
[^acme]: A Cloudflare API token with edit rights on the production zone, a custom Caddy build carrying a DNS solver (the stock image has none), 90-day renewals that fail silently on a closed laptop, and a real private key in the working tree for `detect-secrets` to keep finding.
[^certs-path]: A gitignored `certs/` beside the code would mean one mkcert run per checkout, and a worktree that skipped it fails at dev-server start for a reason that looks nothing like its cause.
[^compose-env]: Compose interpolation reads the project-root `.env` and the shell — never the `env_file:` list, which is a different mechanism — so `.env.development` cannot carry them.
[^chromium]: That holds only while `playwright.config.ts` runs Chromium alone; a WebKit or Firefox project, or running the suite on Linux, would need revisiting.
[^ci-http]: The `.env` it writes includes a literal `CSRF_COOKIE_DOMAIN=math3d.localdev`. Moving CI would mean shipping the leaf key to runners as a rotating secret and installing the root in each runner's trust store — and the suite authenticates through `dummy`, not Google. No workflow invokes `just` on the runner, so nothing there enables the compose profile.
[^cookie-flags]: Deriving them from the scheme would mirror production more exactly, but `Secure` is a browser-side send restriction that no code branches on, so it buys no bug class — and it would force re-keying the `DISABLE_ALLAUTH_RATE_LIMITS` guard, which reads `SESSION_COOKIE_SECURE` as a proxy for "this is production".
[^client-id]: A client ID is public by construction, and its only security property is the origin allowlist, whose entries all resolve to loopback. It cannot reach a production build: Vite loads `.env.development` only in development mode, and the deploy workflow supplies `VITE_GOOGLE_CLIENT_ID` from an Actions variable regardless.
[^origins]: [Google Cloud — Manage OAuth Clients](https://support.google.com/cloud/answer/15549257), on authorized JavaScript origins: the TLD must be on the public suffix list, HTTPS is required outside `localhost`, and "if you use a port other than 80, you must specify it. For example: `https://example.com:8080`".
[^redirect-uri]: [Google — Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server): "Redirect URIs must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule", and "Host TLDs (Top Level Domains) must belong to the public suffix list."
[^csrf]: [`django/middleware/csrf.py:278-279`](https://github.com/django/django/blob/6.0.7/django/middleware/csrf.py#L278-L279) in Django 6.0.7, the pinned version — `good_origin` is built from `request.is_secure()`; the `Referer` fallback runs under [`elif request.is_secure():`](https://github.com/django/django/blob/6.0.7/django/middleware/csrf.py#L442).
[^cf-tunnel]: [Cloudflare — Create a locally-managed tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/).
[^sslip]: [nip.io](https://nip.io/) / [sslip.io](https://sslip.io/) — wildcard DNS returning the IP encoded in the hostname.
[^lhd]: [`Upinel/localhost.direct`](https://github.com/Upinel/localhost.direct).
[^caddy-internal]: [Caddy — Automatic HTTPS](https://caddyserver.com/docs/automatic-https#local-https).
[^vite-mkcert]: [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert).
