# 0004 — OAuth-only authentication

**Status:** Proposed

**Contents**

- [Context](#context)
- [Decision](#decision)
  - [Settings](#settings)
  - [Google alone](#google-alone)
  - [The redirect flow](#the-redirect-flow)
  - [Keeping unsaved work across the redirect](#keeping-unsaved-work-across-the-redirect)
  - [Adding providers later](#adding-providers-later)
  - [Credentials](#credentials)
  - [Registration opens](#registration-opens)
  - [The dummy provider](#the-dummy-provider)
  - [Django admin](#django-admin)
  - [User fields and deletion](#user-fields-and-deletion)
  - [Rollout](#rollout)
- [Consequences](#consequences)
- [Alternatives considered](#alternatives-considered)

Footnotes cite [django-allauth 65.15.0](https://github.com/pennersr/django-allauth/tree/65.15.0), the pinned version.

## Context

Math3d authenticates with django-allauth in headless mode: email + password, mandatory email verification, password reset. All of it is switched off in production behind `VITE_DISPLAY_AUTH_FLOWS` and `ENABLE_REGISTRATION`, so it has never had real users. The few accounts that exist will be deleted by hand before this ships, so production starts with zero users and zero user-owned scenes.

Math3d does not want to handle passwords at all. A leak of stored hashes puts at risk any password a user reuses elsewhere. Verification and reset are the only mail math3d sends, and they pull in Mailjet, `django-anymail`, deliverability concerns, and an inbox harness so E2E can click links in emails. The six auth pages and their tests run ~900 lines. And the teachers and students math3d is for likely already have a Google account.

**Constraints:**

1. **Accounts are never merged** — not now, not later. Attaching a second provider to an existing account is a different operation, covered below.
2. **One provider until explicit linking exists.** `CustomUser.email` is unique, so one person signing in through two providers is a collision, and there is no flow yet to resolve it.
3. **No password hashes and no transactional mail.** This is the point of the change.
4. **A real name never becomes public.** Google returns one with every sign-in. No publicly visible field is ever filled from provider profile data.

Deleting code and rewriting tests is ordinary work, not a cost to weigh, and there is no user data to preserve. That leaves two irreversible mistakes available — merging two accounts, and publishing a name nobody chose to publish — and constraints 1 and 4 rule both out. `next.math3d.org` is an unadvertised beta, so UX mistakes are cheap to undo.

## Decision

**Authenticate only through Google, using the standard OAuth redirect flow.**

A second provider brings email collisions that nothing resolves yet (constraint 2), so ship exactly one. Google is the one math3d's users are most likely to have already.

### Settings

`SOCIALACCOUNT_ONLY = True` removes the password and email-verification endpoints from the headless API.[^only-urls] `ACCOUNT_SIGNUP_FIELDS = ["email*"]` keeps email required, so a provider that returns none can't create an account.[^signup-fields] allauth then refuses to boot unless `ACCOUNT_EMAIL_VERIFICATION = "none"`,[^verif-check] which enforces constraint 3 — under `OPTIONAL`, allauth would still send mail at signup.[^optional-mail] `ACCOUNT_EMAIL_NOTIFICATIONS` is pinned `False` so a future allauth default can't start sending mail either.

Account linking by email is pinned off explicitly and guarded by a settings test, because a provider entry can turn it back on independently of the global setting.[^email-auth]

### Google alone

Google is asked for the `profile` and `email` scopes,[^scopes] and returns the user's identifier, email address and basic profile. None of that is a sensitive scope, so the app needs no verification review from Google. With one provider, every returning user is matched on `uid`,[^uid-match] so linking never comes up.

No signup form is ever shown. allauth sends a new identity whose email is already taken to `auth/provider/signup`,[^dupe-stage] whose form accepts any unused address without comparing it to the one the provider asserted. `CustomSocialAccountAdapter.pre_social_login` refuses such a login instead, so an account's address is always one the provider vouched for. `SOCIALACCOUNT_AUTO_SIGNUP` stays `True` and the adapter's `save_user` refuses any signup form, so that form can't be reached another way; a test pins both.

Google is sent `prompt=select_account` (`AUTH_PARAMS`), so it always shows the account chooser. Without it, a user already signed in to Google goes straight through as that account — the wrong one on a shared school computer, with no way to switch short of signing out of Google.

### The redirect flow

Sign-in is OAuth's authorization-code flow, run by allauth:

1. The SPA submits a real form (a top-level POST, not `fetch`) to `/_allauth/browser/v1/auth/provider/redirect` with `provider=google`, `process=login`, a `callback_url` on the SPA, and the CSRF token as a `csrfmiddlewaretoken` field (a form can't send the `X-CSRFToken` header the API client uses).
2. allauth redirects the tab to Google. Google sends it back to allauth's callback view on the API host, which exchanges the one-time code for tokens, finds or creates the account, and sets the session cookie.
3. allauth redirects to `callback_url`, adding `?error=<code>` if sign-in failed.[^headless-errors] The SPA then reads the session as it does on any page load.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant B as Browser tab (SPA)
    participant A as API (allauth)
    participant G as Google

    U->>B: Sign in with Google
    Note over B: save draft (store + pathname) to sessionStorage
    B->>A: POST /_allauth/browser/v1/auth/provider/redirect<br/>provider, process=login, callback_url, csrfmiddlewaretoken
    Note over A: stash state in the session:<br/>state id, PKCE verifier, callback_url
    A-->>B: 302 to Google's authorize URL<br/>client_id, redirect_uri, scope, state,<br/>code_challenge, prompt=select_account
    B->>G: GET authorize
    G->>U: account chooser, consent
    U->>G: choose account
    G-->>B: 302 to redirect_uri with code, state
    B->>A: GET /_allauth/google/login/callback/?code&state<br/>(session cookie: SameSite=Lax allows a top-level GET)
    Note over A: unstash state by id; unknown state → sign-in error page
    A->>G: POST token endpoint<br/>code, client_secret, code_verifier
    G-->>A: access_token, id_token
    Note over A: decode id_token (TLS, no signature check),<br/>adapter checks, find or create account, log in
    A-->>B: 302 to callback_url (+ ?error=code on failure)<br/>Set-Cookie: sessionid
    Note over B: fresh page load: restore draft on its pathname,<br/>read session via users/me
```

Why redirect rather than Google Identity Services (GIS), whose popup hands JavaScript an ID token to post to `provider/token`:

- **It works for every provider.** allauth supports the redirect flow for all its OAuth2 providers. Only Google, Apple, Facebook and generic OpenID Connect accept `provider/token` (plus the `dummy` test provider), and only once JavaScript already holds a token from the provider, usually via the provider's SDK. GitHub has neither.
- **It's the standard.** The authorization-code flow is plain OAuth 2.0 / OpenID Connect. GIS is Google's own JavaScript API.
- **No third-party script.** Under GIS, a content blocker that stops `gsi/client` leaves no way to sign in. The redirect needs only a URL.
- **Consistent on mobile.** A full-page navigation is ordinary browser behavior; GIS popups vary by browser. _(Expected, not measured.)_
- **Fewer moving parts.** The ID token comes straight from Google's token endpoint over TLS, so OpenID Connect lets allauth skip the signature check.[^decode] Once `provider/token` is closed to Google (below), there is no certs fetch to cache and no token replay to guard against.

The cost is that leaving the page discards the editor's in-memory state — covered next.

**Mounting the callback.** allauth's usual `include("allauth.urls")` also mounts `google/login/token/`: a second, CSRF-exempt login endpoint on the host that serves `/admin/`.[^login-by-token] So `main/urls.py` mounts only Google's own OAuth views — `include(default_urlpatterns(GoogleProvider))` under `_allauth/`, which adds `google/login/` (a 404 under `HEADLESS_ONLY`) and `google/login/callback/`, with no namespace, since allauth reverses `google_callback` unqualified[^callback-view] — plus the dummy provider's routes in development. Each provider added later gets the same one-line mount and its own callback path, `<provider>/login/callback/`, which is the redirect URI registered with that provider.

**Settings for the redirect:**

- `SOCIALACCOUNT_PROVIDERS["google"]["OAUTH_PKCE_ENABLED"] = True`. allauth leaves PKCE off by default for Google.[^pkce]
- `HEADLESS_FRONTEND_URLS["socialaccount_login_error"]` points at the SPA's sign-in error page. allauth uses it when it doesn't know `callback_url`: `provider/redirect` rejected its own input, or the callback couldn't recover the flow's state. It is required — unset, those cases 500 under `HEADLESS_ONLY` — so a backend test that forges the callback's state pins it.[^headless-errors]
- `ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"` on deployments. allauth builds the redirect URI from the request, so otherwise its scheme rests on `SECURE_PROXY_SSL_HEADER` alone, and a proxy change would surface as Google's `redirect_uri_mismatch`.
- `callback_url` needs no extra allowlist: allauth accepts the request host, `ALLOWED_HOSTS`, and hosts from `CSRF_TRUSTED_ORIGINS`,[^safe-url] which already lists the SPA's origins. `EnvConfig` refuses a wildcard in `ALLOWED_HOSTS` on a deployment, since one would widen where sign-in may redirect.

**`provider/token` is closed to Google.** The headless API always mounts it, and E2E needs it for `dummy`, but left alone it would turn any Google ID token issued for our client into a session. No setting turns it off per provider: whether a provider accepts it is the class attribute `supports_token_authentication`. allauth does let settings swap in a provider class, so `SOCIALACCOUNT_PROVIDERS["google"]["provider_class"]` names a `GoogleProvider` subclass in `authentication` with the attribute `False`.[^provider-class] `provider/token` then answers 400 `token_authentication_not_supported` before reading the token, and the headless config stops listing it for Google. A backend test posts a Google token to `provider/token` and expects that refusal, so an allauth upgrade that stops honoring the setting fails CI.

### Keeping unsaved work across the redirect

An anonymous user can build a scene and then sign in to keep it, so the redirect often lands on unsaved work. The SPA carries the editor across it in `sessionStorage`:

- **What:** a draft holding the whole Redux store and the pathname it was saved from, written on every sign-in. The store holds only plain data, including the scene's unsaved flag, so restoring it puts the editor back as it was.
- **Restore:** when the app boots on the draft's pathname within an hour of it being written, it restores the draft and deletes it. Any other boot leaves the draft alone. Matching the path rather than carrying a key in `callback_url` also covers two returns that bypass `callback_url`: Back from Google when the browser reloads the page instead of restoring it from its back/forward cache, and a failed sign-in that lands on the error page, which can link back to the draft's pathname.
- **Back/forward cache:** a page restored from it (`pageshow` with `persisted`) still has its live state, at least as new as the draft, so the draft is deleted unrestored. Otherwise a later reload in that tab would bring back the older draft. When the cache works, Back needs no draft at all.
- **Where it returns:** `callback_url` is the current URL without the sign-in overlay.
- **Precedence:** a restored draft wins over the scene fetched for the URL.
- **Why `sessionStorage`:** it is per tab, survives the round trip within that tab, and is cleared when the tab closes. The one-hour limit keeps a draft from resurfacing long after a sign-in was abandoned.
- **Errors:** `?error=` is shown only as a known code mapped to fixed text, since anyone can craft that URL. A failed code exchange is logged on the backend with its cause; the SPA only ever sees the code.

### Adding providers later

No second provider ships now, but two rules are set now, because both are cheap to keep and expensive to change once accounts exist.

**Accounts are never merged.** Merging two users means repointing every row that references them, picking winners for conflicting fields, and resolving unique constraints — and undoing it would need a record of which rows came from which side, which nothing keeps. If one person ends up with two accounts, they stay two accounts.

**Linking is explicit and authenticated, never inferred from an email address.** To connect a second provider, a signed-in user starts the flow from account settings (the same redirect endpoint with `process=connect`): the session proves they own the account, and the OAuth round trip proves they own the identity. Automatic linking by email invites account takeover — an attacker who registers an address they don't control, or a provider that reports an unverified one, walks into the matching account. allauth's lookup only _prefers_ verified addresses and falls back to unverified ones,[^verified-fallback] so "matched by email" doesn't mean "matched something verified". `SOCIALACCOUNT_EMAIL_AUTHENTICATION` and `..._AUTO_CONNECT` stay off, pinned by the settings test.

So identity is the provider's subject identifier (`uid`); email is just an attribute. Email can change, can be withheld (GitHub hides it unless asked; Apple issues relay aliases), and can be recycled by organizations — none of which is true of `uid`. A sign-in whose address matches an existing account is therefore neither an error nor a new account: it's a prompt to sign in the way that account was created, then connect the new provider from settings.

### Credentials

The backend needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, both required when `IS_DEPLOYMENT` is true, so a deploy missing either fails at boot rather than on the first sign-in click.[^creds] The secret is used to exchange the authorization code. The SPA needs neither — it names the provider, and the backend builds Google's URL — so there is no `VITE_GOOGLE_CLIENT_ID`.

The Google client registers one redirect URI per API host, `https://<api host>/_allauth/google/login/callback/`, and no JavaScript origins. JavaScript origins are what let a page mint ID tokens for the client, so a client carried over from an earlier setup has them removed. Local development is covered by [ADR-0005](0005-local-google-sign-in-testing.md).

`django-allauth` is installed with its `[socialaccount]` extra, which brings the OAuth and JWT libraries Google login needs.

### Registration opens

`ENABLE_REGISTRATION` becomes `True` in production. That is a policy change: `next.math3d.org` goes from a closed beta to something anyone with a Google account can join — in the same change that removes our ability to email them. That is the intent; the point is to let people save scenes. With it `False`, every new Google sign-in fails with `signup_closed`.[^signup-hook]

It's reversible without stranding anyone. Closing registration blocks only _new_ identities; an existing `SocialAccount` logs in without reaching the signup check.[^signup-gate]

**`VITE_DISPLAY_AUTH_FLOWS` stays** for now. It is presentation-only: it hides the signed-out entry points and chooses hamburger vs. avatar for anonymous visitors (`UserMenu.tsx`), and the My Scenes gate is an OR (`ScenesListPage.tsx`), so a signed-in user keeps everything. That makes turning auth on in production a GitHub Actions variable flip, decoupled from shipping code. Remove it once auth has been live long enough to be boring.

### The dummy provider

allauth's `dummy` provider lets E2E sign in without a real provider. It is also an unauthenticated "log in as any user" endpoint on the host that serves `/admin/`, so it is installed only when `IS_DEPLOYMENT` is false. A deployment that set it false would also lose HTTPS redirection, HSTS and secure cookies, and would stop checking its own required config.[^dev-flag] A separate `ENABLE_DUMMY_PROVIDER` flag would be a second switch that must also be wrong, but a deployment in that state is already broken in louder ways, so it would add little.

E2E uses it two ways. Fixtures mint sessions quickly through `provider/token` with `provider=dummy`, seeding `SocialAccount` rows with stable `uid`s. Tests of sign-in itself drive dummy's redirect flow (`dummy/authenticate/`, a plain form): `provider/redirect`, allauth's login completion, the redirect back to `callback_url`, and cancellation. Dummy skips allauth's OAuth2 callback view, so the Google side — the mounted callback, `state` lookup, PKCE, the code exchange, and Google's error mapping — is covered by backend tests that drive `google_callback` with Google's token endpoint stubbed.

### Django admin

The session cookie is host-only on the API host, where `/admin/` is served, and `AdminSite.has_permission` is just `is_active and is_staff`. So a staff user who has signed in through the app already has admin access, with no extra code.

**No `AdminSite` override.** Signed out, `/admin/` still shows Django's password form — `SOCIALACCOUNT_ONLY` doesn't disable it — but no account has a usable password, so the form can't be satisfied. The way in is to sign in on the app first. Replacing the form with a Google redirect adds complexity for no real gain: the admin redirects _every_ failed permission check to its login view, including signed-in non-staff users,[^admin-redirect] so such an override would loop them forever, and it would have to validate the `?next=` URL it receives.

### User fields and deletion

**`public_nickname` is dropped** — the column, the form that edited it, and `PATCH /v1/auth/users/me/`, whose only writable field it was. Under OAuth, filling it at signup means either silently copying Google's real name (ruled out by constraint 4) or interrupting sign-in to ask for a value whose purpose the user can't see yet.[^nickname] Nothing public renders it. A signed-in user is identified by their email address, shown only to them. The header shows a hamburger for anonymous visitors and a generic avatar for signed-in users. If public attribution is added later, it defaults to a generated, editable label — never a provider-supplied name.

**Deleting an account** (`POST /v1/auth/users/me/delete/`) needs only the session, since no account has a password. It orphans the user's scenes rather than deleting them: `Scene.author` is `SET_NULL`, so a departed user's scenes become ordinary anonymous ones and shared links keep working. The migration emits no SQL.[^setnull]

### Rollout

The whole change, redirect flow included, merges as one commit in #1284. Before release:

- delete the existing production accounts by hand;
- set up the production Google client: the redirect URI above, and no JavaScript origins;
- set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `ENABLE_REGISTRATION=true` on Heroku.

Dropping `public_nickname` is the one step a redeploy doesn't undo: the release phase only migrates forward, and a reverted build no longer contains the migration. To roll back, first run `manage.py migrate authentication <previous>` on the build that has it, then revert.

## Consequences

- **Sign-in leaves the page.** Every sign-in is a full navigation to Google and back.
- **Unsaved work depends on the draft restore.** If it breaks, anonymous work is lost at the moment the user signs in to keep it.
- **Starting sign-in is a form POST outside the typed API client.** `provider/redirect` takes form data and a `csrfmiddlewaretoken` field, not JSON.
- **There is a client secret** to store on Heroku and rotate if leaked.
- **E2E session fixtures take a shortcut.** They mint sessions through `provider/token`, which the SPA doesn't use for Google. Sign-in itself is covered by dummy's redirect flow in E2E and Google's callback in backend tests; no automated test talks to Google.
- **Superuser bootstrap happens after the first sign-in.** An account from `createsuperuser` has no `SocialAccount`, and with linking off Google will never match it — signing in with the same address is refused with `email_taken`. So: sign in with Google first, then set `is_staff` and `is_superuser` on that row with a one-off `manage.py shell` line. Development still uses `createsuperuser`, whose password works at `/admin/`.
- **Losing the Google account means losing the admin.** No password fallback is provisioned (see Alternatives). ADR-0002's render budget is managed in the admin (`scenes/admin.py`).
- **Deleting an account needs only the session.** A stolen session can delete the account in one request; the typed confirmation phrase is the only friction, and it is client-side.
- **Taking over someone's Google account takes over their math3d account,** and math3d can't detect it or help short of an admin stepping in by hand: no email notice, no password reset, no session-revocation UI.
- **Google sees every math3d sign-in.**
- **Math3d sends no email** — no security notices, announcements, or shutdown warnings, unless mail is added back.

## Alternatives considered

- **Google Identity Services popup.** GIS renders the button and hands JavaScript an ID token, which the SPA posts to `provider/token`. It keeps sign-in a modal over the live editor, so it needs no draft persistence and no client secret. Rejected for the reasons under [The redirect flow](#the-redirect-flow): it doesn't extend to providers without a token SDK (GitHub), depends on a script blockers can stop, and is Google-specific.
- **The redirect flow inside a popup window.** Open the standard flow with `window.open` and signal the parent when done. Standard and provider-neutral, with no draft persistence. Rejected because popups are often unreliable on mobile, so a full-page fallback — and draft persistence with it — would be needed anyway.
- **Do nothing.** Auth is switched off and costs nothing today. Rejected: the flags hold back an otherwise finished feature while keeping password machinery alive for no users.
- **OAuth and passwords side by side.** The usual reason, not stranding existing users, doesn't apply — there are none. Rejected.
- **Passwords for staff only.** One hash would give a password-protected `/admin/` and remove the lockout risk. Rejected: the admin is the most valuable account, so it's the worst one to leave on a reusable credential.
- **Cloudflare Access in front of `/admin/`.** No code, and Cloudflare is already in the stack (ADR-0001, ADR-0002). It solves admin access, not app login, so it stays the fallback if the signed-out admin form becomes a real obstacle.
- **Magic links (`ACCOUNT_LOGIN_BY_CODE_ENABLED`).** No password hashes, but email becomes required for every login, so deliverability becomes an availability problem. Also incompatible with `SOCIALACCOUNT_ONLY`.[^code-check] Rejected.
- **OIDC terminated at a proxy** (a gateway forwarding a signed identity header, as in mitodl/mit-learn). Needs a gateway and an identity provider math3d doesn't run, for what allauth already does inside Django. Rejected.

[^only-urls]: [`headless/account/urls.py:27`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/account/urls.py#L27) — the remaining patterns are added only `if not allauth_settings.SOCIALACCOUNT_ONLY`.
[^verif-check]: [`account/checks.py:38-43`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/checks.py#L38-L43) — a `Critical` check, so it fails the boot.
[^optional-mail]: [`account/stages.py:154-156`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/stages.py#L154-L156) — under `OPTIONAL`, `EmailVerificationStage` still sends mail; only `MANDATORY` blocks the login.
[^signup-fields]: `ACCOUNT_SIGNUP_FIELDS = ["email*"]`. Removing it turns off the derived [`SOCIALACCOUNT_EMAIL_REQUIRED`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/app_settings.py#L63-L71), which is the only thing stopping a provider response with no email from auto-creating an account with a blank address ([`flows/signup.py:83-87`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/signup.py#L83-L87)).
[^scopes]: [`google/provider.py:61-65`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L61-L65) — `email` is added when `SOCIALACCOUNT_QUERY_EMAIL` is true, which defaults to `SOCIALACCOUNT_EMAIL_REQUIRED` ([`socialaccount/app_settings.py:11-16`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/app_settings.py#L11-L16)), true here.
[^uid-match]: [`socialaccount/models.py:343-348`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/models.py#L343-L348) — `_lookup_by_socialaccount` matches on `(provider, uid)` alone.
[^dupe-stage]: [`socialaccount/internal/flows/signup.py:52-88`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/signup.py#L52-L88) — when the address already belongs to someone, auto-signup is abandoned in favour of the signup form.
[^headless-errors]: [`headless/socialaccount/internal.py`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/internal.py#L16-L94) — `complete_login` redirects to the flow's `next` URL (our `callback_url`) with `error` and `error_process` added on failure. `on_authentication_error` falls back to `socialaccount_login_error` when there is no state: an invalid `provider/redirect` form ([`views.py:58-65`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/views.py#L58-L65)) or unrecoverable callback state. Under `HEADLESS_ONLY` an unset key raises `ImproperlyConfigured` ([`core/internal/httpkit.py:118-119`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/core/internal/httpkit.py#L118-L119)).
[^decode]: [`google/views.py:95-104`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/views.py#L95-L104) — `verify_signature = not self.did_fetch_access_token`, citing [OpenID Connect Core §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation).
[^login-by-token]: [`google/urls.py`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/urls.py) adds `google/login/token/` after `default_urlpatterns`. [`LoginByTokenView`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/views.py#L119-L159) is `csrf_exempt` and `login_not_required`, isn't gated by `HEADLESS_ONLY`, and checks only a `g_csrf_token` double-submit cookie before turning a POSTed credential into a session.
[^callback-view]: `default_urlpatterns` mounts `login/` and `login/callback/`. `login/` 404s under `HEADLESS_ONLY` ([`base/views.py:12-14`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/base/views.py#L12-L14)); `OAuth2CallbackView` doesn't inherit that check. The redirect URI is built with an unqualified `reverse("google_callback")` ([`oauth2/views.py:55-58`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/oauth2/views.py#L55-L58)).
[^provider-class]: The registry registers `SOCIALACCOUNT_PROVIDERS[<id>]["provider_class"]` in place of the built-in class ([`providers/__init__.py:47-52`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/__init__.py#L47-L52)); `provider/token` checks the attribute before calling `verify_token` ([`headless/socialaccount/inputs.py:78-84`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/inputs.py#L78-L84)), and the config lists the flow only when it is set ([`headless/socialaccount/response.py:22-23`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/response.py#L22-L23)). `urls.py` still passes allauth's own `GoogleProvider` to `default_urlpatterns`, which finds the views by the class's package ([`oauth2/urls.py:6-8`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/oauth2/urls.py#L6-L8)).
[^pkce]: [`oauth2/provider.py:17,30-38`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/oauth2/provider.py#L17-L38) — `pkce_enabled_default = False`, overridable per provider with `OAUTH_PKCE_ENABLED`; Google doesn't override the default.
[^safe-url]: [`account/adapter.py:598-619`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/adapter.py#L598-L619) — `is_safe_url` allows relative URLs, the request host, `ALLOWED_HOSTS` (wildcards included), and the hosts in `CSRF_TRUSTED_ORIGINS`.
[^creds]: `EnvConfig._require_deployment_config` (`main/env.py`) already requires `GOOGLE_CLIENT_ID`; `GOOGLE_CLIENT_SECRET` joins it. Both reach allauth through `SOCIALACCOUNT_PROVIDERS["google"]["APP"]`, the same dict the linking settings test guards.
[^signup-hook]: [`socialaccount/adapter.py:163`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L163) delegates to our account adapter's `is_open_for_signup`, which returns `settings.ENABLE_REGISTRATION`. On the callback path, `SignupClosedException` becomes `?error=signup_closed` ([`headless/socialaccount/internal.py:64-65`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/internal.py#L64-L65)).
[^signup-gate]: [`socialaccount/internal/flows/login.py:72-81`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/login.py#L72-L81) — only the new-identity branch calls `process_signup`, whose first step is the `is_open_for_signup` check.
[^dev-flag]: `IS_DEPLOYMENT` is this project's own `EnvConfig` field, defaulting to `True`. When false, `settings.py` skips `SECURE_SSL_REDIRECT` and HSTS, turns off `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE`, and widens `ALLOWED_HOSTS`, and `EnvConfig._require_deployment_config` stops requiring production config. A deployment that set it false would break in far louder ways than an extra test provider.
[^admin-redirect]: `AdminSite.admin_view` calls `redirect_to_login(request.get_full_path(), reverse("admin:login"))` whenever `has_permission` is false (`django/contrib/admin/sites.py:243-246`).
[^nickname]: [`socialaccount/app_settings.py:19-25`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/app_settings.py#L19-L25) — auto-signup skips the signup form, and [`save_user`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L100-L107) calls the account adapter's hook only `if form`, so the hook that collected the nickname never runs. Google's [`extract_common_fields`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L78-L83) returns only `email`, `first_name` and `last_name`.
[^setnull]: `on_delete` is enforced by Django, not the database, so the migration is free to apply and revert. `author` is already `null=True`.
[^email-auth]: [`socialaccount/adapter.py:351-359`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L351-L359) — `app.settings["email_authentication"]` wins when set; otherwise the global is OR'd with the provider's own setting, so a provider entry can turn linking on but not off. The settings test asserts both spellings are absent: lowercase inside `APP["settings"]`, uppercase at the `SOCIALACCOUNT_PROVIDERS["google"]` level ([`Provider.get_settings`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/base/provider.py#L91-L92)).
[^verified-fallback]: [`account/utils.py:263-267`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/utils.py#L263-L267) — `filter_users_by_email` narrows to verified addresses only when at least one exists.
[^code-check]: [`account/checks.py:28-33`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/checks.py#L28-L33) — `SOCIALACCOUNT_ONLY does not work with ACCOUNT_LOGIN_BY_CODE_ENABLED`.
