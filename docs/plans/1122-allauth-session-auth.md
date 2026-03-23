# Plan: Issue #1122 — Migrate auth from Djoser + token auth to django-allauth + session auth

## Goal

Replace Djoser (DRF-specific) with `django-allauth` in headless mode for account management. Switch from token auth to cookie/session auth so auth is framework-agnostic and carries forward to Django Ninja with no changes.

## Current State

### Backend

- **Auth library**: Djoser with `rest_framework.authtoken` (token-based)
- **Custom user model**: `authentication.CustomUser` (email-based login, `AbstractBaseUser`, `is_active` defaults to `False`)
- **Custom views**: `CustomUserViewSet` overriding Djoser's `UserViewSet` with registration gating (`ENABLE_REGISTRATION`), custom password reset for inactive users, admin user activation
- **Custom email classes**: 7 classes in `authentication/email.py` extending Djoser's `BaseEmailMessage` for activation, confirmation, password reset, etc.
- **Email templates**: 3 HTML templates (activation, password_reset, password_reset_inactive)
- **Settings**: `DJOSER` config block in `main/settings.py` (lines 196-242), `TokenAuthentication` in `REST_FRAMEWORK`
- **URLs**: `/v0/auth/` mounting custom user viewset + `djoser.urls.authtoken`
- **Known bug**: `activate_other` view sets `target.is_admin = True` but `CustomUser` has no `is_admin` field — this is a no-op. Will fix during rewrite.

### Frontend

- **Token storage**: `localStorage` key `"apiToken"`, sent as `Authorization: Token {token}` header
- **API client**: Generated OpenAPI client using `Configuration.apiKey` for auth
- **Auth hooks**: 10 React Query hooks in `packages/api/src/hooks/auth/index.ts` calling Djoser endpoints
- **Auth state**: `AuthStatusProvider` context checking `localStorage` for token presence
- **Auth pages**: Login, Register, Activation, Password Reset, Password Reset Confirm, Logout, Settings (profile, password change, delete account)
- **API base URL**: Frontend talks to `http://localhost:8000` via `VITE_API_BASE_URL`

### E2E Tests

- **Fixtures**: `users.ts` injects token into Playwright `storageState.localStorage`
- **Auth utils**: `getAuthToken()` calls `authTokenLoginCreate`, `createActiveUser()` uses admin to activate

## Design Decisions

### 1. django-allauth headless mode

allauth's headless mode provides a JSON API (no server-rendered HTML) at `/_allauth/browser/v1/` prefix. It handles login, signup, email verification, password reset, and password change — all via JSON request/response. The `browser` client type uses Django session cookies natively.

### 2. Session auth with CSRF

- DRF `SessionAuthentication` reads Django's session cookie
- Django's CSRF middleware requires a CSRF token for unsafe methods (POST, PUT, DELETE)
- The frontend will read the CSRF token from the `csrftoken` cookie and send it as `X-CSRFToken` header
- `CSRF_COOKIE_HTTPONLY = False` (default) so JS can read the cookie
- allauth's headless browser endpoints handle CSRF internally via Django middleware

### 3. Cross-origin cookies between :3000 and :8000 (dev)

In development, frontend (`localhost:3000`) and backend (`localhost:8000`) are different **origins** (different port) but the **same site** (both `localhost`). This means:

- Django's default `SameSite=Lax` session cookies **are sent** on same-site requests, even across different ports
- `django-cors-headers` already handles CORS via `CORS_ALLOWED_ORIGINS`
- No proxy, `/etc/hosts`, or nginx needed

The only additions required:

- `CORS_ALLOW_CREDENTIALS = True` — tells CORS middleware to include `Access-Control-Allow-Credentials: true` header
- `CSRF_TRUSTED_ORIGINS = [env("APP_BASE_URL")]` — so Django accepts CSRF tokens from `http://localhost:3000`
- `withCredentials: true` on axios — so browser sends cookies on cross-origin requests

In production, frontend (`next.math3d`) and API (`api.next.math3d`) are on different subdomains but the same site. CORS is already configured and working. Session cookies set by the API subdomain are sent back to the API subdomain — no `SESSION_COOKIE_DOMAIN` change needed since the frontend only sends requests _to_ the API.

### 4. Endpoint mapping (Djoser → allauth headless)

| Feature                | Djoser endpoint                               | allauth headless endpoint                         |
| ---------------------- | --------------------------------------------- | ------------------------------------------------- |
| Login                  | `POST /v0/auth/token/login/`                  | `POST /_allauth/browser/v1/auth/login`            |
| Logout                 | `POST /v0/auth/token/logout/`                 | `DELETE /_allauth/browser/v1/auth/session`        |
| Register               | `POST /v0/auth/users/`                        | `POST /_allauth/browser/v1/auth/signup`           |
| Verify email           | `POST /v0/auth/users/activation/`             | `POST /_allauth/browser/v1/auth/email/verify`     |
| Resend verification    | `POST /v0/auth/users/resend_activation/`      | `PUT /_allauth/browser/v1/auth/email`             |
| Get current user       | `GET /v0/auth/users/me/`                      | `GET /_allauth/browser/v1/auth/session`           |
| Update user            | `PATCH /v0/auth/users/me/`                    | Custom DRF endpoint (keep)                        |
| Reset password         | `POST /v0/auth/users/reset_password/`         | `POST /_allauth/browser/v1/auth/password/request` |
| Reset password confirm | `POST /v0/auth/users/reset_password_confirm/` | `POST /_allauth/browser/v1/auth/password/reset`   |
| Change password        | `POST /v0/auth/users/set_password/`           | `POST /_allauth/browser/v1/auth/password/change`  |
| Delete account         | `DELETE /v0/auth/users/me/`                   | Custom DRF endpoint (keep)                        |
| Admin activate         | `POST /v0/auth/users/{id}/activation/`        | Custom DRF endpoint (keep)                        |

### 5. Custom endpoints that remain as DRF views

allauth doesn't cover everything we need. These stay as simple DRF APIViews (will later migrate to Ninja):

- `GET/PATCH /v0/auth/users/me/` — get/update user profile (public_nickname)
- `DELETE /v0/auth/users/me/` — delete account (requires `current_password`)
- `POST /v0/auth/users/{id}/activate_other/` — admin activation (also marks email as verified in allauth's `EmailAddress` table)

These will use `SessionAuthentication` instead of `TokenAuthentication`.

### 6. `is_active` behavior change

**This is a key behavioral difference between Djoser and allauth.**

Current (Djoser): `is_active` starts as `False`, toggled to `True` on email verification. Inactive users cannot log in.

allauth: Tracks email verification in its own `EmailAddress` model (`verified` field). allauth expects `is_active=True` from signup and gates login on `ACCOUNT_EMAIL_VERIFICATION = "mandatory"` (checks `EmailAddress.verified`).

**Decision**: Change `CustomUser.is_active` default to `True`. allauth handles login gating via email verification status. This aligns with allauth's expectations. The `is_active` field remains available for admin-level account suspension if ever needed.

**No user-facing change.** The user experience is identical: sign up → can't log in until email verified → verify → can log in. Only the internal gating mechanism changes (from `is_active` flag to `EmailAddress.verified`). The data migration (Step 1.7) ensures existing unverified users get `EmailAddress(verified=False)`, so they still can't log in.

### 7. Registration gating

allauth supports a custom `ACCOUNT_ADAPTER` where we override `is_open_for_signup()` to check `settings.ENABLE_REGISTRATION`.

### 7a. `public_nickname` during signup

allauth's signup flow only handles `email` and `password` by default. Since we set `ACCOUNT_USERNAME_REQUIRED = False` and `ACCOUNT_USER_MODEL_USERNAME_FIELD = None`, allauth has no concept of our `public_nickname` field.

**Solution**: Use allauth's custom signup form to declare `public_nickname` as an accepted extra field, and override `save_user()` in the adapter to persist it. In headless mode, allauth does not use Django forms with `cleaned_data` in the traditional sense — the recommended approach for allauth 65.x is:

1. Define a custom signup form via `ACCOUNT_FORMS = {"signup": "authentication.forms.CustomSignupForm"}` that declares `public_nickname` as a form field
2. Override `save_user()` in the adapter to read the extra field and set it on the user

The exact mechanism should be verified against allauth 65.x headless docs during implementation, as the form/adapter interaction in headless mode has evolved across versions. The frontend sends `public_nickname` as an extra field in the signup JSON request body.

**Validation**: allauth's dynamic OpenAPI spec generation (`specify_custom_signup_form()` in `allauth/headless/spec/internal/schema.py`) iterates over `base_signup_form_class().base_fields` and adds each field to the `BaseSignup` schema. This confirms the custom signup form is the intended mechanism — `public_nickname` will appear as a typed field in the generated spec automatically.

### 8. Password reset for inactive/unverified users

**Current behavior**: If an unverified user requests a password reset, they get an activation email instead of a reset email.

**allauth behavior**: allauth will not send a password reset to an unverified email — it sends a verification email instead. This is essentially the same behavior, just handled automatically. No custom code needed.

If we need exact replication of the "password reset for inactive users" flow, we can override the adapter's `send_password_reset_mail()`. But allauth's default is likely sufficient and arguably better.

### 9. `re_password` (password retype) fields

Djoser validates password confirmation server-side (`re_password`, `re_new_password` fields). allauth does NOT do server-side password retype validation — the frontend handles "type your password twice" client-side only.

**Impact**: Frontend forms already do client-side password match validation. Remove the `re_password`/`re_new_password` fields from form submissions to allauth. The server-side validation loss is acceptable since client-side validation covers it.

### 10. allauth response format

allauth headless wraps responses in a standard envelope:

- Success: `{"status": 200, "data": {...}}`
- Error: `{"status": 400, "errors": [{"code": "...", "message": "...", "param": "..."}]}`

This differs from Djoser's DRF-style `{"field": ["error message"]}` format. Frontend error handling (`setFieldErrors` utility in auth pages) must be rewritten to parse allauth's error envelope.

### 11. OpenAPI spec: merge allauth + DRF specs for unified TS generation

allauth can dynamically serve its own OpenAPI spec (via `HEADLESS_SERVE_SPECIFICATION = True`) at `/_allauth/openapi.yaml`. This spec is **dynamic** — allauth's `get_schema()` function:

- Strips paths for disabled features (no 2FA, no social auth → those paths removed)
- Pins `{client}` to `browser` when `HEADLESS_CLIENTS = ["browser"]`
- **Automatically adds custom signup form fields** (like `public_nickname`) to the `BaseSignup` schema via `specify_custom_signup_form()` — this validates that the custom form approach (Design Decision 7a) is the intended pattern
- Customizes the `User` schema via `get_adapter().get_user_dataclass()`

**Strategy**: Merge the allauth OpenAPI spec with the DRF spec (from drf-spectacular) into a single combined spec, then run `openapi-generator-cli` once to produce a unified TypeScript client. This gives us:

- Swagger docs covering all endpoints (auth + scenes)
- Generated TypeScript types for allauth endpoints (no hand-written types needed)
- Single generated API client package

**Version compatibility**: Both specs use OpenAPI 3.0.x (drf-spectacular produces 3.0.3, allauth's bundled spec is also 3.0.3). No conversion needed.

**Generating the allauth spec without a running server**: allauth's `get_schema()` function (`allauth.headless.spec.internal.schema.get_schema()`) returns the spec as a Python dict. We can export it via a Django management command or one-liner script (similar to how `manage.py spectacular` works), no running server required.

**Component name collisions**: Both specs may define `ErrorResponse`, `User`, etc. Use `openapi-merge-cli`'s `dispute.prefix` option to prefix allauth components (e.g., `AllAuth` prefix), or manually rename conflicting components in a post-processing step. Decide the prefix convention upfront so generated TypeScript type names are predictable (e.g., `AllAuthErrorResponse`, `AllAuthUser`).

**Server URLs**: The merged spec needs a single consistent `servers` block. Strip or unify the `servers` entries from both specs before merging.

The merge step is added to `scripts/generate_openapi.sh`. Use `openapi-merge-cli` (npm package) or a short Python script to combine the two YAML files.

### 12. User-facing impact: all existing sessions invalidated

Switching from token auth to session auth means **all existing logged-in users will be logged out**. Their localStorage tokens become meaningless when the frontend stops sending them. This is acceptable for a hobby project — users simply log in again. The migration does not affect passwords or accounts.

## Implementation Steps

### Phase 1: Backend — Install and configure allauth (coexist with Djoser temporarily)

**Step 1.1: Add django-allauth dependency**

- Add `django-allauth>=65.0,<66.0` to `webserver/pyproject.toml`
- Run `uv lock && uv sync`

**Step 1.2: Configure allauth in Django settings**

Add to `INSTALLED_APPS`:

```python
"django.contrib.sites",     # Required by allauth
"allauth",
"allauth.account",
"allauth.headless",
```

Add `SITE_ID = 1` (required by allauth's sites framework dependency). The `django.contrib.sites` initial migration auto-creates a `Site` record with `id=1`. For existing databases, verify this row exists after migration; if not, create it via data migration or `Site.objects.get_or_create(id=1, defaults={"domain": "math3d.org", "name": "Math3d"})`.

Add to `MIDDLEWARE` (after `AuthenticationMiddleware`):

```python
"allauth.account.middleware.AccountMiddleware",
```

Add `AUTHENTICATION_BACKENDS`:

```python
AUTHENTICATION_BACKENDS = [
    "allauth.account.auth_backends.AuthenticationBackend",
]
```

Configure allauth settings:

```python
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_LOGIN_BY_CODE_ENABLED = False
ACCOUNT_ADAPTER = "authentication.adapter.CustomAccountAdapter"
HEADLESS_ONLY = True
HEADLESS_CLIENTS = ["browser"]  # No mobile app; disable token-based 'app' client
HEADLESS_SERVE_SPECIFICATION = True  # Serve OpenAPI spec at /_allauth/openapi.yaml
HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": f"{env('APP_BASE_URL')}/auth/activate-account?key={{key}}",
    "account_reset_password_from_key": f"{env('APP_BASE_URL')}/auth/reset-password/confirm/?key={{key}}",
}
```

Note: `HEADLESS_FRONTEND_URLS` uses f-strings to inject `APP_BASE_URL` from environment at settings load time, with `{{key}}` escaped so allauth sees `{key}` as its template variable.

**During transition only** — accept both auth methods so the app isn't broken between backend and frontend deploys:

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",  # removed in Phase 2
    ),
}
```

Confirm `SESSION_ENGINE` is the default `"django.contrib.sessions.backends.db"` (it is — sessions are already in the DB).

Add CORS/CSRF settings for cross-origin cookie auth:

```python
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [env("APP_BASE_URL")]  # e.g., "http://localhost:3000"
```

**Step 1.3: Create custom account adapter and signup form**
New file: `authentication/adapter.py`

```python
from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings

class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ENABLE_REGISTRATION

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.public_nickname = form.cleaned_data.get("public_nickname", "")
        if commit:
            user.save()
        return user
```

New file: `authentication/forms.py` — custom signup form declaring `public_nickname` as an accepted field so allauth passes it through to `save_user()`. The exact form class approach should be verified against allauth 65.x headless docs (see Design Decision 7a).

Add to allauth settings in Step 1.2:

```python
ACCOUNT_FORMS = {"signup": "authentication.forms.CustomSignupForm"}
```

**Step 1.4: Configure allauth email templates**
allauth uses templates at `templates/account/email/` by convention. Create:

- `authentication/templates/account/email/email_confirmation_subject.txt` — "Activate your account"
- `authentication/templates/account/email/email_confirmation_message.html` — activation link with `{{ activate_url }}`
- `authentication/templates/account/email/password_reset_key_subject.txt` — "Password reset on {{ site_name }}"
- `authentication/templates/account/email/password_reset_key_message.html` — reset link

These replace the current Djoser templates. Preserve the `data-testid` attributes used by E2E tests to find links in emails.

**Step 1.5: Add allauth URLs**
In `main/urls.py`:

```python
path("_allauth/", include("allauth.headless.urls")),
```

**Step 1.6: Change `CustomUser.is_active` default**
Change default from `False` to `True` in `authentication/models.py`. Create a Django migration for this change. allauth manages login gating via email verification status, not `is_active`.

**Step 1.7: Data migration — populate allauth EmailAddress table**
Create a Django data migration in the `authentication` app (must run BEFORE Djoser is removed):

```python
def populate_email_addresses(apps, schema_editor):
    CustomUser = apps.get_model("authentication", "CustomUser")
    EmailAddress = apps.get_model("account", "EmailAddress")
    for user in CustomUser.objects.all():
        EmailAddress.objects.get_or_create(
            user=user,
            email=user.email,
            defaults={"verified": user.is_active, "primary": True},
        )
```

This marks existing active users' emails as verified and existing inactive users' emails as unverified.

**Step 1.8: Run migrations**

```bash
python manage.py migrate
```

This runs allauth's schema migrations + our data migration + the `is_active` default change.

### Phase 2: Backend — Rewrite custom views + remove Djoser

**Step 2.1: Rewrite custom DRF views**
Simplify `authentication/views.py` — remove `CustomUserViewSet` (allauth handles signup, login, logout, activation, password reset). Replace with simple DRF APIViews:

- `UserMeView` (GET, PATCH) — return/update current user profile (`public_nickname`)
- `UserMeDeleteView` (DELETE) — delete current user (requires `current_password`)
- `AdminActivateView` (POST) — admin-only user activation. Must:
  - Set `user.is_active = True` (as before)
  - Remove the bogus `is_admin = True` (bug fix)
  - Also create/update `EmailAddress(user=target, email=target.email, verified=True, primary=True)` so allauth considers the email verified

All use `authentication_classes = [SessionAuthentication]` + `permission_classes = [IsAuthenticated]` (or `IsAdminUser` for admin activate).

Reuse `CustomUserSerializer` from `authentication/serializers.py` in `UserMeView` for response serialization.

Delete `authentication/filters.py` — the `CustomUserFilterSet` was only used by the Djoser-based ViewSet's admin-only list endpoint, which is being removed.

Update `authentication/urls.py` to route to new views (no more DefaultRouter/ViewSet).

**Step 2.2: Remove Djoser**

- Remove `djoser` from `pyproject.toml`
- Remove `"djoser"` from `INSTALLED_APPS`
- Remove entire `DJOSER` settings block
- Remove `TokenAuthentication` from `DEFAULT_AUTHENTICATION_CLASSES` (keep only `SessionAuthentication`)
- Delete `authentication/email.py` (Djoser email classes)
- Delete old Djoser email templates (`authentication/templates/email/`)
- Keep `rest_framework.authtoken` in `INSTALLED_APPS` for now (table stays until DRF is fully removed per #1125)

**Step 2.3: Update backend tests**
Rewrite `authentication/views_test.py` to test:

- Registration flow via allauth headless endpoints (signup → email sent → verify key → can log in)
- Login/logout via allauth headless session endpoints
- Password reset flow via allauth headless
- Registration gating (`ENABLE_REGISTRATION=False` → signup returns error)
- Custom endpoints: GET/PATCH user profile, DELETE account, admin activate
- Verify that admin activate also marks email as verified in `EmailAddress`

Update test helper to authenticate via session (use Django test client's `login()` or call allauth login endpoint) instead of token auth.

### Phase 3: Frontend — Switch to session/cookie auth

**Step 3.0: Merge OpenAPI specs and regenerate frontend client**
**Prerequisite**: Phase 2 must be complete (Djoser removed) so the DRF spec doesn't contain stale Djoser endpoints.

Update `scripts/generate_openapi.sh` to:

1. Generate the DRF spec via `manage.py spectacular` (as before — now contains only custom auth views + scene endpoints, no Djoser)
2. Export the allauth spec via a one-liner: `uv run python -c "import yaml; from allauth.headless.spec.internal.schema import get_schema; print(yaml.dump(get_schema()))" > allauth-openapi.yaml` (or a small management command)
3. Merge the two specs into a single combined YAML using `openapi-merge-cli` or a script. Prefix allauth components to avoid name collisions (e.g., `AllAuthUser` vs DRF's `User`).
4. Run `openapi-generator-cli` on the merged spec to produce a unified TypeScript client.

This must be done before the remaining Phase 3 steps so generated types are available for hook development.

**Step 3.1: Update API client configuration**
`packages/api/src/hooks/util.ts`:

- Remove `apiKey` / token logic from `getConfig()`
- Configure axios for cookie auth + CSRF:

  ```typescript
  // Send cookies on all requests (needed for cross-origin session auth)
  axios.defaults.withCredentials = true;

  // Read CSRF token fresh from cookie before each request
  // (Django rotates the token, so it must not be cached at module load)
  function getCsrfToken(): string {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  }

  axios.interceptors.request.use((config) => {
    config.headers["X-CSRFToken"] = getCsrfToken();
    return config;
  });
  ```

- Remove `API_TOKEN_KEY` constant

**Step 3.2: Rewrite auth API hooks**
Rewrite `packages/api/src/hooks/auth/index.ts`. After the OpenAPI spec merge (Step 5.1), the allauth endpoints will be in the generated TypeScript client alongside the DRF scene endpoints. Use the generated client methods:

- `useLogin()` → generated client for `POST /_allauth/browser/v1/auth/login` with `{email, password}`
- `useLogout()` → generated client for `DELETE /_allauth/browser/v1/auth/session`
- `useSession()` → generated client for `GET /_allauth/browser/v1/auth/session` (replaces `useUserMe` for auth status; returns user data in session envelope)
- `useCreateUser()` → generated client for `POST /_allauth/browser/v1/auth/signup` with `{email, password, public_nickname}` — `public_nickname` appears in the generated types because allauth's dynamic spec includes custom signup form fields (see Design Decision 7a + 11)
- `useActivateUser()` → generated client for `POST /_allauth/browser/v1/auth/email/verify` with `{key}`
- `useResendVerification()` → generated client for `PUT /_allauth/browser/v1/auth/email` with `{email}`
- `useResetPassword()` → generated client for `POST /_allauth/browser/v1/auth/password/request` with `{email}`
- `useResetPasswordConfirm()` → generated client for `POST /_allauth/browser/v1/auth/password/reset` with `{key, password}` — note: allauth's password reset key may be a composite `uidb36-token` format; verify against allauth 65.x docs during implementation and ensure `HEADLESS_FRONTEND_URLS` template and frontend URL parsing match
- `useUpdatePassword()` → generated client for `POST /_allauth/browser/v1/auth/password/change` with `{current_password, new_password}`
- `useUserMePatch()` → keep calling custom `PATCH /v0/auth/users/me/` (still in DRF spec)
- `useUserMeDelete()` → keep calling custom `DELETE /v0/auth/users/me/` (still in DRF spec)

Note: allauth's session endpoint returns user data in allauth's `User` schema format, while `UserMeView` returns data in the DRF `CustomUserSerializer` format. These may have different shapes. The frontend should normalize or handle both — e.g., extract `public_nickname` from the DRF response and auth status from the allauth session response.

Note: Step 3.0 (spec merge + client regeneration) must be done first so generated types are available.

**Step 3.3: Update error handling in auth pages**
Rewrite `setFieldErrors` utility (or create a new `parseAllAuthErrors` helper) to handle allauth's error format. The `ErrorResponse` schema is in the generated types from the merged spec:

```typescript
// allauth error format (generated as ErrorResponse type):
// { status: 400, errors: [{ code: "email_taken", message: "...", param: "email" }] }
// Map `param` to form field, `message` to error text. Errors without `param` are non-field errors.
```

Update all auth pages (LoginPage, RegistrationPage, ResetPasswordPage, ResetPasswordConfirmPage, ChangePasswordForm, DeleteAccountForm) to use the new error parsing.

**Step 3.4: Update auth pages**

- **LoginPage**: Call new `useLogin()`, remove token storage. On success, login creates a session cookie automatically — just reset queries and update auth state.
- **RegistrationPage**: Call new `useCreateUser()`. Remove `re_password` field from submission (keep client-side match validation). Adapt to allauth signup response format.
- **ActivationPage**: URL changes from `?uid={uid}&token={token}` to `?key={key}`. Call `useActivateUser()` with `{key}`.
- **ResetPasswordPage**: Call new `useResetPassword()`.
- **ResetPasswordConfirmPage**: URL changes from `?uid={uid}&token={token}` to `?key={key}`. Call `useResetPasswordConfirm()` with `{key, password}`. Remove `re_new_password` from submission.
- **LogoutPage**: Call new `useLogout()`. Remove localStorage cleanup.
- **ChangePasswordForm**: Remove `re_new_password` from submission. Use new `useUpdatePassword()`.
- **DeleteAccountForm**: Uses custom endpoint, minimal changes.

**Step 3.5: Update AuthStatusProvider**
Remove localStorage-based auth detection. Derive auth status from `useSession()` query result: authenticated if session response contains user data, unauthenticated otherwise.

**Step 3.6: Update frontend routes**

- Activation route: update to expect `?key={key}` instead of `?uid={uid}&token={token}`
- Password reset confirm route: update similarly
- Update `routes.tsx` if URL path patterns change

**Step 3.7: Remove token-related code**

- Remove `API_TOKEN_KEY` export from `packages/api`
- Remove all `localStorage.getItem/setItem/removeItem("apiToken")` calls
- The old Djoser-specific generated types (`TokenCreateRequest`, `UserCreatePasswordRetypeRequest`, `ActivationRequest`, etc.) are replaced by allauth-specific generated types from the merged spec — no hand-written types needed

### Phase 4: E2E Tests — Switch to session auth

**Step 4.1: Update Playwright auth utilities**
`packages/app-tests-e2e/src/utils/api/auth.ts`:

- Replace `getAuthToken()` with a function that logs in via allauth and returns session cookies:
  ```typescript
  const getSessionCookies = async (
    user: UserCredentials,
  ): Promise<Cookie[]> => {
    // Use Playwright's request context to POST to login endpoint
    // Extract session cookies from response
  };
  ```
- Update `createActiveUser()`: admin activation endpoint is now the custom DRF view. Must use session auth (admin logs in first, gets cookies, then calls activate endpoint).

`packages/app-tests-e2e/src/utils/api/config.ts`:

- Remove token-based `Configuration`. For API calls in test setup, use axios with `withCredentials: true` or pass cookies explicitly.

**Step 4.2: Update Playwright fixtures**
`packages/app-tests-e2e/src/fixtures/users.ts`:

- Replace `storageState.localStorage` token injection with cookie-based auth:
  ```typescript
  page: async ({ page: basePage, browser, sessionCookies }, use) => {
    if (sessionCookies) {
      const context = await browser.newContext({
        storageState: {
          cookies: sessionCookies,
          origins: [],
        },
      });
      page = await context.newPage();
    }
    // ...
  };
  ```

**Step 4.3: Update E2E auth flow tests**

- `signup-and-delete.test.ts`: Update for allauth response format, new activation URL (`?key=...`), updated email template structure
- `signout.test.ts`: Update for session-based logout
- `password-change.test.ts`: Update for new password change endpoint, remove `re_new_password`
- `header/auth-user-header.test.ts`: Should work if session auth is properly set up

### Phase 5: Cleanup and verification

**Step 5.1: Final spec regeneration check**
Verify the merged OpenAPI spec (generated in Step 3.0) is up to date with any changes made during Phases 3-4. Re-run `scripts/generate_openapi.sh` if needed.

**Step 5.2: Update environment variables**

- Verify `CORS_ALLOWED_ORIGINS`, `APP_BASE_URL` are correct
- `CSRF_TRUSTED_ORIGINS` is set from `APP_BASE_URL` in Step 1.2 — verify production value is correct

**Step 5.3: Run full test suite**

- Backend: `just be test`
- Frontend: `yarn test`
- E2E: build production app first (`yarn build`), then `yarn test-e2e`
- Lint + typecheck: `yarn lint && yarn typecheck`

**Step 5.4: Manual smoke test**

- Register → activate via email → login → create scene → save → logout → login again → verify scene persists
- Password reset flow
- Use `claude --chrome` at localhost:3000 for visual verification

## Deployment Strategy

This migration must be deployed atomically — backend + frontend together. The dual-auth transition (Step 1.2: both `SessionAuthentication` and `TokenAuthentication`) exists only during development to allow incremental work, not for a staged production rollout.

**Deployment steps:**

1. Deploy backend with allauth configured + Djoser removed + session auth only
2. Deploy frontend with cookie-based auth simultaneously
3. All existing users are logged out (tokens invalidated) — they log in again

**Rollback**: If issues arise post-deploy, revert both backend and frontend to previous versions. The allauth DB tables (`account_emailaddress`, etc.) are additive and won't conflict with Djoser. The data migration (EmailAddress population) is safe to leave in place even if rolled back.

## Risk Mitigation

1. **Data migration**: Existing users' emails are populated in allauth's `account_emailaddress` table via a Django data migration. Active users → `verified=True`. Inactive users → `verified=False`. This migration runs before Djoser is removed and is idempotent.

2. **CSRF in development**: `localhost:3000` and `localhost:8000` are same-site, so `SameSite=Lax` cookies work. `CORS_ALLOW_CREDENTIALS = True` + `CSRF_TRUSTED_ORIGINS` + `withCredentials: true` handle the cross-origin aspect. No proxy needed. In production, same-domain deployment simplifies further.

3. **allauth response format**: allauth uses `{status, data}` / `{status, errors}` envelope format, not DRF's `{field: [errors]}`. Frontend error handling must be rewritten. This is explicitly called out in Step 3.4.

4. **Email template differences**: allauth uses different template context variables than Djoser (`{{ activate_url }}` vs custom `{{ url }}`). Templates must be rewritten. Preserve `data-testid` attributes for E2E tests.

5. **Activation URL format change**: allauth uses a single `key` instead of `uid` + `token`. Frontend routes, email templates, and activation page must all align on `?key={key}`.

6. **All users logged out on deploy**: Acceptable for a hobby project. Document in release notes.

## Out of Scope

- Removing `rest_framework.authtoken` from INSTALLED_APPS / dropping table (deferred to #1125)
- Social auth / OAuth (not currently used, can add later via allauth)
- MFA (not currently used, can add later via allauth)
- Django Ninja migration (that's #1123)
