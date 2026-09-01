# 0004 — OAuth-only authentication

**Status:** Accepted (2026-08-27)

**Contents**

- [Context](#context)
- [Decision](#decision)
  - [Settings](#settings)
  - [Google alone](#google-alone)
  - [The popup flow first](#the-popup-flow-first)
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

Math3d authenticates with django-allauth in headless mode: email + password, mandatory email verification, password reset. The whole surface is switched off in production behind `VITE_DISPLAY_AUTH_FLOWS` and `ENABLE_REGISTRATION`, so it has never carried real users. The few accounts that do exist are being removed by hand before any of this lands, so this decision assumes production starts with zero users and zero user-owned scenes.

Math3d does not want to run password authentication at any size. Storing hashes makes a breach a credential-stuffing incident against other sites, and more users would make that worse rather than more worthwhile. Verification and reset are the only mail math3d sends, and they pull in Mailjet, `django-anymail`, deliverability, and an inbox harness so E2E can click links out of emails. Six auth pages and their tests run ~900 lines. Every user math3d wants already has a Google account.

**Scope.** Four constraints bound the decision:

1. **Identities are never merged.** Two existing accounts are never collapsed into one — not in this change and not later. Attaching a second provider to an account that already exists is a different operation, and the rules for it are set out below.
2. **One provider until explicit linking exists.** `CustomUser.email` is unique, so if one person signs in through two different providers, the second is not a separate account — it is a collision, and there is no flow yet to resolve it.
3. **No password hashes, and no transactional mail.** The point of the exercise, not a side effect.
4. **A real name never becomes public.** Google returns one with every sign-in. No publicly visible field may be populated from provider profile data — not silently, not by default.

How the work is weighed: deleting code and rewriting tests is ordinary work, not a cost to trade against, and there is no user data to preserve. That leaves two irreversible things on the table — collapsing two accounts into one, and publishing a name nobody chose to publish — and constraints 1 and 4 take both off it. `next.math3d.org` is an unadvertised beta, so UX regressions revert cheaply.

## Decision

Authenticate only through Google OAuth.

The argument in one line: merging identities is the only unrepairable decision here, so ship exactly one provider — and the one provider every math teacher and student already has is Google.

### Settings

`SOCIALACCOUNT_ONLY = True` removes the password and email-verification endpoints from the headless API,[^only-urls] leaving signup to collect an email address and nothing else.[^signup-fields] A Django system check then refuses to boot unless `ACCOUNT_EMAIL_VERIFICATION = "none"`,[^verif-check] which is what makes constraint 3 enforced rather than aspirational — under `OPTIONAL`, allauth still mails at signup.[^optional-mail]

Constraint 1 is enforced in code too, not prose: account linking is pinned off explicitly rather than left on allauth's defaults, guarded by a settings test, because a provider entry can switch it back on independently of the global.[^email-auth]

### Google alone

`email` and `profile` — the only scopes allauth requests — are non-sensitive, so Google needs no verification review. With a single provider, every returning user is matched on `uid`,[^uid-match] so there is no second identity to link and the question never arises.

Sign-in asks nothing beyond Google: one click, and the duplicate-email signup stage is unreachable[^dupe-stage] because no two identities can present the same address.

### The popup flow first

Two shapes are available, and the choice is ours. The **redirect** flow navigates the whole tab to Google and returns through allauth's `OAuth2CallbackView`, which mounts separately from the headless API and survives `HEADLESS_ONLY`.[^callback-view] The **popup** flow keeps the tab: Google Identity Services renders the button, a popup handles consent, JavaScript receives an ID token, and the SPA posts it to `POST /_allauth/browser/v1/auth/provider/token`, which verifies the signature against Google's certs with `audience = client_id` and completes the login.[^verify-token]

Ship the popup. Redirect is the better long-term shape and the intended destination, but starting there means paying its cost up front, and that cost is not the redirect itself — it is everything the redirect breaks. Scene state is in-memory Redux, so a top-level navigation discards whatever the user was building; the natural flow is to build anonymously, hit Save, and get prompted, which means the redirect lands precisely on unsaved work. Making that safe needs draft persistence to `sessionStorage`, which is a feature with its own design questions (what is serialized, when it clears, whether a restored draft outranks the scene fetched for the URL you return to). The popup has none of that: sign-in stays a modal over a live editor, exactly as it is today.

It also collapses two paths into one. `provider/token` is already how the E2E harness mints sessions with `dummy`, so under the popup the tests exercise the same endpoint users do, rather than a parallel shortcut.

The cost is a dependency on Google's `gsi/client` script. If an extension blocks it, sign-in has no fallback, whereas the redirect flow depends on nothing but a URL — and Google's Identity Services surface changes more often than plain OAuth does. That is the reason redirect wins eventually. It is not a reason to build the redirect's mitigations before the redirect exists.

**None of the redirect's scaffolding ships either.** Not the `allauth.urls` include that carries `OAuth2CallbackView`, not a registered redirect URI, not `GOOGLE_CLIENT_SECRET`, and not the `socialaccount_login_error` frontend URL. Each of these serves the callback and nothing else: the token endpoint reverses no provider URL, verifies with `client_id` alone — the secret exists to exchange an authorization code, which this flow skips — and routes its failures through `ProviderTokenView`'s own handlers rather than `on_authentication_error`, the sole reader of that URL key.[^token-path] Adding them alongside the callback later is a few lines; carrying them meanwhile means configuration that no code path reaches, which is the kind of thing that rots unnoticed and then fails when finally used. Google needs an _authorized JavaScript origin_ instead, which is a different field on the same client.

### Adding providers later

Nothing here ships a second provider, but two rules are decided now, because both are cheap to hold to and expensive to reverse once accounts exist.

**Accounts are never merged.** Collapsing two existing users into one means repointing every row that references them, choosing winners for conflicting fields, and resolving anything unique-constrained on both sides — and it cannot be undone afterwards, because nothing records which rows came from which side. No feature is worth that. If two accounts exist for one person, they stay two accounts.

**Linking is explicit and authenticated, never inferred from an email address.** To connect a second provider, a signed-in user starts the flow from their own account settings: the session proves they hold the account, the OAuth round trip proves they hold the identity, and nothing is guessed. Automatic linking by email is the tempting alternative and it is an account-takeover vector — an attacker who registers an address they do not control, or a provider that reports an unverified one, walks into the matching account. allauth's own lookup only _prefers_ verified rows and falls back to unverified ones,[^verified-fallback] so "matched by email" is not the same as "matched something verified". `SOCIALACCOUNT_EMAIL_AUTHENTICATION` and `..._AUTO_CONNECT` stay off, which the settings test already pins.

The corollary is that identity is the provider's subject identifier and email is only an attribute. Email is mutable, sometimes withheld (GitHub keeps it private unless scoped; Apple issues relay aliases), and recycled by enterprise tenants — none of which is true of `uid`.

So a login whose address matches an existing account is not an error and not a new account: it is a prompt to sign in the way that account was created and connect the new provider from settings. That turns an invisible security decision into a one-time step a user can understand.

### Credentials

The client ID is required config in production, validated at boot alongside `APP_BASE_URL`.[^creds] The client _secret_ is not: it exists to exchange an authorization code, which the popup flow never obtains, so it arrives with the redirect flow or not at all. A missing client ID must fail the boot; otherwise the deploy comes up healthy and 500s on the first login click. The requirement turns on with the sign-in button, not with the provider: until a user can click Google there is nothing to 500 on, and requiring it earlier would gate an invisible backend change on a manual Google Cloud step — `EnvConfig` is constructed at settings import, so an unset variable fails the release-phase `migrate`, not just the web dyno.

The SPA needs the same client ID at build time, since the button is rendered client-side. Client IDs are public by design, so this is a build variable, not a secret.

Only production needs a real client. The `rc` environment builds without deploying, and local development cannot register one on the hostnames it uses today: Google exempts only `localhost` and its loopback IPs from the HTTPS requirement, and separately requires the host's TLD to be on the public suffix list,[^redirect-uri] so `http://api.math3d.localdev:8000` fails on both counts. Running the real flow locally would mean moving both servers onto `localhost` — giving up the shared-registrable-domain cookie arrangement that dev deliberately mirrors from production — or terminating TLS locally for a domain math3d owns. Neither is needed to develop against `dummy`, and the credentials are their own switch: unset, the Google provider is inert, so no flag is needed to keep it out of a development environment.

Google login also depends on packages Mailjet is currently paying for, so the dependency change has to land before the mail backend is removed.[^extra]

### Registration opens

`ENABLE_REGISTRATION` becomes `True` in production — a policy change, not plumbing. `next.math3d.org` goes from a closed beta to an instance anyone with a Google account can join, in the same change that removes our ability to email those users about anything. That is the intent; the work exists so people can save scenes. The flag also gates social signup through the shared adapter hook,[^signup-hook] so leaving it `False` fails every signup with `signup_closed` behind buttons the SPA still renders — and there is no other way to exercise the real Google flow, since it cannot run locally.

It is reversible without stranding anyone. Closing registration again blocks only _new_ accounts: `_authenticate` sends an existing `SocialAccount` straight to `_login` and reaches `process_signup`'s gate only for an identity it has never seen.[^signup-gate] So the flag can go back to `False` after the flow is confirmed, and everyone who signed in meanwhile keeps signing in.

**`VITE_DISPLAY_AUTH_FLOWS` stays.** It is a separate question from authenticating with Google, and it is the kill switch: it hides the signed-out entry points, decides hamburger versus avatar for anonymous visitors (`UserMenu.tsx:33`), and gates the My Scenes tab (`ScenesListPage.tsx:38`). Turning auth on in production is then flipping a GitHub Actions variable, an operational step decoupled from shipping the code — which matters when sign-in depends on a third-party script that may need switching off in a hurry. Retiring the flag is cleanup for later, once auth has been live long enough to be boring.

### The dummy provider

allauth ships a `dummy` provider for testing. It lets E2E mint sessions without a live provider, and it is also an unauthenticated "log in as any uid" endpoint: `POST /auth/provider/token` turns a JSON `id_token` into a session, on the host that serves `/admin/`. So it is registered only under `IS_DEVELOPMENT`, which is the strongest gate available: production cannot set that flag without simultaneously turning off secure cookies, HSTS, and TLS redirection, and dropping the required-config guards that make a deploy boot at all.[^dev-flag]

A dedicated `ENABLE_DUMMY_PROVIDER` was considered and rejected. Any guard strong enough to keep it out of production reduces to "refuse unless `IS_DEVELOPMENT`" — production sets `SESSION_COOKIE_SECURE` unconditionally — so the second flag could never hold a value the first does not already imply, and a knob whose reachable states are a subset of another knob's is not a second policy. `DISABLE_ALLAUTH_RATE_LIMITS` earns its own flag by contrast, because leaving rate limits on in development is a coherent thing to want; running development without `dummy` is not.

### Django admin

After a callback allauth calls Django's `login()`; `SESSION_COOKIE_DOMAIN` is unset, so the session cookie is host-only on `api.math3d.org`, where `/admin/` is served. `AdminSite.has_permission` is `is_active and is_staff`. So a staff user who has signed in through the app already reaches the admin, with no code at all — an OAuth account plus staff gets the admin site, which is the whole requirement.

**No `AdminSite` override ships.** `/admin/` while signed out still renders Django's password form, which no account can satisfy; the way in is to sign in on the app first and come back. Replacing that form with an OAuth redirect is where the complexity lives, and it buys a convenience nobody needs: `admin_view` redirects _every_ failed `has_permission` to the login view, a signed-in non-staff user included,[^admin-redirect] so an override that bounces to the provider sends that user around the loop forever. It would also have to validate the `?next=` it is handed — `admin_view` puts `request.get_full_path()` there — or open a redirect that fires _after_ a session is established.

### User fields and deletion

`public_nickname` is dropped — the column, the profile form that edited it, and `PATCH /v1/auth/users/me/`, whose only writable field it was. It existed to label a user on publicly shared scenes, and under OAuth the only ways to fill it are to copy Google's real name in silently or to interrupt a one-click sign-in with a prompt for a value whose purpose the user cannot yet see.[^nickname] Constraint 4 rules out the first, and the second buys little: the field is not unique and nothing renders it today, so a user who never chose one costs nothing. A signed-in user is identified by their email address, shown only to themselves.

If public attribution is built later, it defaults to a generated label the user can edit — never a name supplied by an identity provider — and giving every existing account one is a data migration with no collisions to resolve.

`POST /v1/auth/users/me/delete/` drops its password check, which returns `False` for every unusable password — left alone, no user could ever delete their account. The session is the gate instead.

Deleting an account orphans its scenes rather than destroying them: `Scene.author` migrates from `CASCADE` to `SET_NULL` (`scenes/models.py`), which turns a departed user's scenes into ordinary anonymous ones. Today that endpoint hard-deletes every scene the account ever published, breaking every shared link to them — dormant only because auth is flag-gated, and this is the change that arms it. It is the only path that reaches the cascade: `CustomUser` is not registered in the Django admin, so there is no delete-user action there. `author` is already nullable, so the migration emits no DDL.[^setnull]

### Rollout

Five pull requests, the first of which is this ADR. Password auth keeps working until the last one, and everything before it reverts by redeploying.

1. **This ADR.** Documentation only, so the plan below can be argued over before any of it is built.
2. **Backend, additive.** The provider, the `[socialaccount]` dependency extra, `dummy` under `IS_DEVELOPMENT`, the URL include, the `SET_NULL` migration, `delete_me`'s password check — dropped early because a session minted through a provider has no password to check, so the E2E fixtures in PR 3 could not clean up after themselves — and the user-menu avatar, which throws on the blank nickname every provider signup produces. Nothing user-visible: Google login works alongside the existing password flow, because a provider-verified address satisfies `ACCOUNT_EMAIL_VERIFICATION = "mandatory"` without a verification stage.[^verified-skip]
3. **E2E harness.** Fixtures mint sessions through `dummy` rather than password login, and the tests that can only exist on the password path are deleted with them. Still invisible in the product, and it puts every authenticated test on the OAuth path before anything user-facing is touched — the harness rewrite is the largest piece of this change, and it should not land in the same commit as the deletions it would otherwise be blamed for.
4. **Sign-in UI.** The Google Identity Services button, posting its ID token to `provider/token`, behind the existing display flag. The client ID becomes required config here, which makes creating the OAuth client a prerequisite for this PR rather than for the backend one.
5. **Removal.** `SOCIALACCOUNT_ONLY`, verification `none`, `ENABLE_REGISTRATION = True`, and the deletion of the password pages, `public_nickname`, and the Mailjet stack.

The order is forced in three places: the dependency extra must precede the mail backend's removal,[^extra] `ENABLE_REGISTRATION` cannot open before password signup is gone, since one flag gates both,[^signup-hook] and `SET_NULL` must land before deletion is reachable.

Dropping the `public_nickname` column is the one step a redeploy does not undo, and it ships inside PR 5 (the removal PR) rather than trailing it. Separating it would be the textbook expand/contract sequence — the release phase migrates while the previous dynos still serve, so a column disappearing under running code is briefly an error — but that window is measured in seconds on an instance with no users, and there is no traffic for a separated PR to soak in. The rollback is `manage.py migrate authentication <prev>` before the reverted build serves, which belongs in the PR description.

Clearing the existing production accounts is a prerequisite, not a step: it happens by hand, before PR 5, and is not automated anywhere in this change.

## Consequences

- **Sign-in depends on Google's `gsi/client` script loading.** An extension that blocks it leaves no way in, where the redirect flow would have needed only a URL. Accepted on an unadvertised beta; the remedy is the redirect flow, not a second parallel path.
- **Moving to the redirect flow later owes draft persistence.** Scene state is in-memory Redux, and a top-level navigation discards it — landing on unsaved work, since the natural flow is to build anonymously and hit Save. The popup avoids this entirely by keeping sign-in a modal over the live editor. Whoever adds the redirect adds `sessionStorage` persistence with it, along with the `allauth.urls` include, a registered redirect URI, `GOOGLE_CLIENT_SECRET`, and the `socialaccount_login_error` key.
- **Superuser bootstrap runs after the first sign-in, not before.** `createsuperuser` works, but the account it creates carries no `SocialAccount` row, and with linking off Google will never match it. Signing in afterwards with the same address collides on the unique email and lands in social-signup limbo instead. So the order is: sign in through Google first, then set `is_staff` and `is_superuser` on the row allauth created. That is a one-off `manage.py shell` line, not a management command — it runs once in production, and development gets its admin from `seed_test_data`.
- **Losing the Google account means losing the admin**, with no password fallback. That is where ADR-0002's render budget lives (`scenes/admin.py`).
- **Google account takeover is now math3d account takeover**, and we can neither detect nor remediate it: no email notice, no password reset, no session-revocation UI.
- **Google sees every math3d sign-in.**
- **Math3d can no longer email its users** — no security notice, service announcement, or shutdown warning. `ACCOUNT_EMAIL_NOTIFICATIONS` is pinned `False` so a future allauth default cannot start mailing through a backend we no longer configure.
- **The E2E session harness is rebuilt, not edited.** Password login backs every authenticated test, and `createActiveUser` also uses the signup and staff-activation endpoints; all of them disappear. Fixtures mint sessions via `provider/token` with `provider=dummy`, seeding `SocialAccount` rows with stable uids rather than matching users by email — the same endpoint the popup uses in production, so the harness is no longer a parallel shortcut around the real path.
- **Sign-in goes through the ordinary typed client.** `provider/token` is a JSON endpoint, so unlike `/auth/provider/redirect` — which needs a real cross-origin form POST, being neither JSON-input nor CSRF-exempt — it needs no special case in `packages/api`.

## Alternatives considered

- **Do nothing.** Auth is dark and costs nothing today. Rejected: the flags are the only thing holding back a feature that is otherwise finished, and every month it stays dark is a month of password machinery kept alive for no user.
- **Run OAuth and passwords side by side.** The usual reason — not stranding existing users — does not apply; there are none. It keeps every cost above and adds the OAuth surface on top. Rejected.
- **Keep passwords for staff only.** One hash buys back a password-authenticated `/admin/` and removes the lockout risk. Rejected: the admin is the highest-value account in the system, so it is the worst one to leave standing on a reusable credential.
- **Cloudflare Access in front of `/admin/`.** Zero code, and Cloudflare is already the stack (ADR-0001, ADR-0002). It solves admin access without solving app login, so it remains the fallback if the signed-out admin form ever becomes a real obstacle.
- **Magic links (`ACCOUNT_LOGIN_BY_CODE_ENABLED`).** Removes password hashes but makes email load-bearing for every login, turning deliverability into an availability problem. Also incompatible with `SOCIALACCOUNT_ONLY`.[^code-check] Rejected.
- **Proxy-terminated OIDC** (a gateway forwarding a signed identity header, as in mitodl/mit-learn). Needs a gateway and an IdP math3d does not run, for an outcome allauth already delivers inside Django. Rejected.

[^only-urls]: [`headless/account/urls.py:27`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/account/urls.py#L27) — the `if not allauth_settings.SOCIALACCOUNT_ONLY:` guard that the remaining patterns are appended behind.
[^verif-check]: [`account/checks.py:38-43`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/checks.py#L38-L43) — a `Critical`, so it fails the boot rather than warning.
[^optional-mail]: [`account/stages.py:154-156`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/stages.py#L154-L156) — `EmailVerificationStage` calls `send_verification_email_at_login` under `OPTIONAL` too, even though only `MANDATORY` blocks the login.
[^signup-fields]: `ACCOUNT_SIGNUP_FIELDS = ["email*"]`. Trimming it further flips the derived `SOCIALACCOUNT_QUERY_EMAIL` to false, and Google requests the `email` scope only when that is [true](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L61-L65) — so every signup would silently land without an address.
[^setnull]: `on_delete` is enforced by Django in Python, not by the database, so the migration emits no DDL — it is free to apply and free to revert. `author` is already `null=True`.
[^creds]: `GOOGLE_CLIENT_ID` declared in `EnvConfig`, required when `not IS_DEVELOPMENT`, and passed through `SOCIALACCOUNT_PROVIDERS[...]["APP"]` — the same dict the linking settings test guards. The SPA reads the same value as `VITE_GOOGLE_CLIENT_ID` at build time; the backend verifies incoming ID tokens against it, so the two must not drift.
[^redirect-uri]: [Google's redirect-URI validation rules](https://developers.google.com/identity/protocols/oauth2/web-server) — "Redirect URIs must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule", plus the requirement that the host's TLD belong to the public suffix list.
[^dev-flag]: `IS_DEVELOPMENT` is this project's own `EnvConfig` field, not a Django setting. Its `else` branch sets `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE` false and widens `ALLOWED_HOSTS` (`main/settings.py:101-108`), and `_require_production_config` stops requiring `APP_BASE_URL`, `CSRF_COOKIE_DOMAIN`, and `DATABASE_URL` (`main/env.py:120-137`). A production deploy that set it would be broken in far louder ways than a registered test provider.
[^extra]: `django-allauth` must be pinned with its `[socialaccount]` extra. `oauthlib`, `pyjwt`, and `cryptography` are absent today (`jwtkit.py` imports the latter two at module scope), and `requests` is present only transitively via `django-anymail` — so removing Mailjet without the extra breaks Google login.
[^nickname]: [`socialaccount/app_settings.py:19-25`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/app_settings.py#L19-L25) — `AUTO_SIGNUP` defaults true, and Google supplies a verified address, so no signup form is rendered. `ACCOUNT_SIGNUP_FORM_CLASS` is a base of the social signup form as well as the password one, but auto-signup short-circuits it, and [`save_user`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L100-L107) calls the account adapter only `if form` — so the hook that collects the nickname today never runs. Nor does the provider supply one: [`extract_common_fields`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L78-L83) returns `email`, `first_name`, and `last_name`; only the email maps to a `CustomUser` field. The value is therefore silently blank unless an adapter assigns `extra_data["name"]` — the real name.
[^email-auth]: [`socialaccount/adapter.py:351-359`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L351-L359) — `app.settings["email_authentication"]` wins outright when set; otherwise the global is OR'd with the provider's own setting, so a provider entry can turn it on but never off. The two levels use different key spellings, and the settings test has to assert the absence of both: lowercase `email_authentication` inside `APP["settings"]`, uppercase `EMAIL_AUTHENTICATION` at the `SOCIALACCOUNT_PROVIDERS["google"]` level, which is what [`Provider.get_settings`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/base/provider.py#L91-L92) reads.
[^verified-fallback]: [`account/utils.py:263-267`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/utils.py#L263-L267) — `filter_users_by_email` narrows to verified addresses only when at least one exists; with none, the unverified matches are returned unchanged.
[^uid-match]: [`socialaccount/models.py:343-348`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/models.py#L343-L348) — `_lookup_by_socialaccount` matches on `(provider, uid)` alone.
[^dupe-stage]: [`socialaccount/internal/flows/signup.py:52-88`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/signup.py#L52-L88) — `process_auto_signup_email` calls `assess_unique_email` and, when the address already belongs to someone, abandons auto-signup and routes to the signup form instead.
[^signup-gate]: [`socialaccount/internal/flows/login.py:72-81`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/login.py#L72-L81) — `_authenticate` branches on `sociallogin.is_existing`; only the new-identity branch calls `process_signup`, whose first act is the `is_open_for_signup` check ([`flows/signup.py:106-108`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/internal/flows/signup.py#L106-L108)).
[^signup-hook]: [`socialaccount/adapter.py:163`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/adapter.py#L163) delegates to the account adapter's `is_open_for_signup`, which here is ours (`authentication/adapter.py:34`) returning `settings.ENABLE_REGISTRATION`.
[^callback-view]: [`socialaccount/providers/base/views.py:12-14`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/base/views.py#L12-L14) — the `Http404` is in `BaseLoginView.dispatch`, which `OAuth2CallbackView` does not inherit.
[^verify-token]: [`socialaccount/providers/google/provider.py:93-106`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L93-L106) — `verify_token` decodes the credential against Google's certs with `audience=self.app.client_id`, then builds the `SocialLogin`. [`headless/socialaccount/views.py:98-110`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/views.py#L98-L110) is the endpoint that calls it.
[^token-path]: `complete_token_login` ([`headless/socialaccount/internal.py:51`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/headless/socialaccount/internal.py#L51)) calls `flows.login.complete_login(..., raises=True)` directly, and `ProviderTokenView` converts the exceptions to API responses itself. `on_authentication_error` — the only reader of `socialaccount_login_error` — sits on the callback path instead. The single `reverse()` in `socialaccount/helpers.py:48` is likewise reached only through `render_authentication_error`.
[^admin-redirect]: `AdminSite.admin_view`'s wrapper calls `redirect_to_login(request.get_full_path(), reverse("admin:login"))` whenever `has_permission` is false (`django/contrib/admin/sites.py:243-246`). There is no `PermissionDenied` anywhere in that module.
[^verified-skip]: [`account/stages.py:157-162`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/stages.py#L157-L162) — `MANDATORY` interrupts a login only when `has_verified_email` is false, and Google's [`extract_email_addresses`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/socialaccount/providers/google/provider.py#L85-L91) marks the address verified straight from the `email_verified` claim.
[^code-check]: [`account/checks.py:28-33`](https://github.com/pennersr/django-allauth/blob/65.15.0/allauth/account/checks.py#L28-L33) — `SOCIALACCOUNT_ONLY does not work with ACCOUNT_LOGIN_BY_CODE_ENABLED`.
