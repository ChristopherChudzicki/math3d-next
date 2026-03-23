# Epic: Backend Schema & API Modernization

Modernize the backend API layer and math item schema validation to get:

- Native OpenAPI spec generation (via Django Ninja + Pydantic)
- Pydantic-based math item validation replacing JTD
- Typed math item definitions in the OpenAPI spec, with TS-level sync checks against frontend source-of-truth types
- Frontend TS types remain the source of truth (they include evaluated types that JSON Schema can't express)
- Simpler auth: django-allauth (headless) + session/cookie auth, replacing Djoser + token auth

Migration is **incremental** — auth is migrated first (framework-agnostic), then Django Ninja endpoints are added as `v1/` alongside existing DRF `v0/` endpoints, then DRF is removed once `v0/` has no consumers.

---

## Why Django Ninja over DRF

This project's API is small (~4 scene endpoints + legacy + auth), consumed by a single React SPA, JSON-only. DRF's strengths — deep CRUD automation via ModelViewSets, complex multi-tenant permissions, content negotiation — aren't things we need. Meanwhile, DRF's weaknesses directly affect us: the OpenAPI spec requires the third-party `drf-spectacular`, serializers are a proprietary abstraction with no equivalent outside DRF, and `items` ends up typed as `{}` in the generated spec.

**What Ninja gives us:**

- **Native OpenAPI** (big motivation) from Pydantic models — no third-party library, and math items can be properly typed as a discriminated union in the spec
- **Pydantic schemas** replace DRF serializers — standard, fast, reusable outside the framework
- **Function-based endpoints** — explicit, no deep inheritance chains (`ModelViewSet → GenericAPIView → APIView → View` + mixins) to debug
- **Built-in `FilterSchema`** — replaces `django-filter` with a Pydantic-based approach
- **Built-in async support**

**What we lose (and why it's fine for this project):**

- **No ModelViewSet** — we write each endpoint explicitly (~30 lines vs ~4 for CRUD). Our endpoints have custom logic (legacy migration, `times_accessed` tracking), so ViewSets wouldn't save much.
- **Simpler permission system** — auth via decorators per-endpoint/router instead of `permission_classes`. Our permissions are just "is authenticated" + "is author", so this is adequate.
- **No automatic exception handling** — DRF auto-catches 404s and validation errors into JSON responses. Solved with a one-time global exception handler in Ninja.
- **Smaller community** — fewer SO answers and third-party packages. Less impactful for a small API surface.

**On maintenance concerns:** DRF itself is in a similar single-maintainer situation — Tom Christie stepped back years ago, and Carlton Gibson (former Django Fellow) has been vocal about DRF's serializers being "last generation." Both projects are maintained but not actively evolving. Ninja is a thinner layer (over Django + Pydantic), so if it were abandoned, the migration path is straightforward — Pydantic models stay, and only the routing layer needs rewiring. DRF's serializers are a deeper lock-in.

---

## ~~#1121: Replace JTD with JSON Schema for math item validation~~ (closed)

Subsumed by #1123. The Pydantic math item models built in #1123 directly replace JTD validation, making a standalone JTD → JSON Schema conversion unnecessary.

---

## #1122: Migrate auth from Djoser + token auth to django-allauth + session auth

**Layer:** Backend + frontend

Replace Djoser (DRF-specific) with `django-allauth` in headless mode for account management (registration, email verification, login, password reset). Switch from token auth to cookie/session auth — Django's session middleware handles it natively.

`django-allauth` is framework-agnostic (works with Django's built-in auth, not tied to DRF or Ninja), so it works with the existing DRF `v0/` endpoints immediately and will carry forward to Ninja `v1/` with no changes.

On the frontend, update API client configuration, auth hooks, and any token storage/refresh logic to use cookies instead. Update Playwright test fixtures to use session auth — Playwright's `storageState` feature can authenticate once and reuse cookies across tests, which is simpler than the current token injection approach.

Rewrite Djoser's custom email classes (`authentication/email.py`) using allauth's template/email system for activation, password reset, etc.

Existing user passwords are unaffected — `CustomUser` extends Django's `AbstractBaseUser`, so password hashes are Django-native and work with allauth out of the box. No password resets needed.

**Why before Ninja:** Decouples auth risk from framework risk. If something breaks in production, you know which change caused it. Also simplifies #1123 — when standing up Ninja endpoints, auth is already settled (just add `SessionAuth` to the router).

**Dependencies:** None.

---

## #1123: Add Django Ninja alongside DRF (`v1/` endpoints) + replace JTD with Pydantic validation

**Layer:** Backend

Add Django Ninja to the project. Stand up a parallel set of `v1/` endpoints that replicate the existing `v0/` DRF endpoints:

- `v1/scenes/` — list, create
- `v1/scenes/{key}/` — retrieve, update, delete
- `v1/scenes/me/` — user's scenes
- `v1/legacy_scenes/` — legacy scene retrieval/creation

Define Pydantic schemas for request/response models, including typed Pydantic models for the 16 math item types (replacing JTD validation). Django Ninja generates the OpenAPI spec natively from these — no drf-spectacular needed for `v1/`. Update `scripts/generate_openapi.sh` to also generate the `v1/` spec (Ninja's built-in export) and produce a TypeScript client from it.

DRF `v0/` endpoints remain untouched and continue to serve production traffic. Both coexist in the same Django process sharing models, ORM, auth, and middleware. Auth is already on session/cookies (from #1122), so Ninja endpoints just use the built-in `SessionAuth`.

**JTD removal (subsumes #1121):** The Pydantic math item models serve as both the API schema and the validation layer, making a standalone JTD → JSON Schema conversion unnecessary. As part of this work:

- Replace `JtdValidator` on `Scene.items` with validation via the Pydantic math item models
- Remove the `jtd` Python dependency
- Remove `webserver/scenes/math_items/schema.jtd.yaml`
- Update or remove the frontend `schema.spec.ts` tests (validation is now covered by Pydantic + the TS sync check in #1124)

**Key consideration:** Write characterization tests against `v0/` _before_ building `v1/`, so you can verify behavioral parity (status codes, error shapes, edge cases).

**Dependencies:** #1122 (auth already migrated).

---

## #1124: Add math item types to the OpenAPI spec + TS sync check

**Layer:** Backend schemas + frontend client + CI

Wire the typed Pydantic math item models (built in #1123) into the Scene Pydantic schema so `items` is `list[MathItem]` (discriminated union on `type`) instead of `Any`.

Regenerate the TypeScript client from the new spec — it should now produce typed discriminated unions. Evaluate whether the manual `StrictScene` wrapper in `packages/api/src/types.ts` can be simplified or removed.

Add a TypeScript-level sync check that verifies the generated API types are compatible with the source-of-truth types in `packages/mathitem-configs`. The generated types (from OpenAPI) should be the un-evaluated version of the mathitem-config types — a compile-time assignability test can verify mutual subtyping:

```typescript
// If this compiles, the types are in sync
const _check: GeneratedMathItem = {} as MathItem;
const _check2: MathItem = {} as GeneratedMathItem;
```

No intermediate JSON Schema generation or fragile codegen tools needed — both sides are already in TypeScript, so the compiler does the work.

**Dependencies:** #1123 (Pydantic models make discriminated unions natural in OpenAPI).

---

## #1125: Switch frontend to `v1/` endpoints and remove DRF

**Layer:** Frontend + backend cleanup

Update `packages/api/` to point at `v1/` endpoints. Regenerate the TypeScript client from the Django Ninja OpenAPI spec. Verify all frontend functionality works against `v1/`.

Once `v0/` has no consumers:

- Remove DRF views, serializers, URL configs
- Remove `djangorestframework`, `drf-spectacular`, `django-filter` dependencies
- Remove `rest_framework.authtoken` from INSTALLED_APPS and create a migration to drop the `authtoken_token` table (the only DRF-specific DB table; rows became inert when #1122 switched to session auth)
- Remove the old drf-spectacular step from `scripts/generate_openapi.sh`

**Key risk:** Legacy scene URLs may be accessed directly by external users. Consider keeping `v0/legacy_scenes/` alive longer or adding redirects.

**Dependencies:** #1123 and #1124 (v1 endpoints must exist and be typed).

---

## #1126: Database-level JSON Schema validation (optional)

**Layer:** Database

PostgreSQL 17+ supports `json_schema_is_valid()` as a `CHECK` constraint. This gives DB-level protection even if application code bypasses `full_clean()`. If on PG 16, a trigger-based approach is an alternative.

Worth evaluating whether this adds meaningful safety for a hobby project, or if application-level validation is sufficient.

**Dependencies:** #1123 (Pydantic models must exist; JSON Schema for DB constraints can be exported from them).

---

## Suggested order

```
#1122 (Djoser -> allauth + sessions)
  |
  +---> #1123 (Django Ninja v1/ alongside DRF v0/ + JTD removal via Pydantic)
          |
          +---> #1124 (Typed math items in OpenAPI + TS sync)
          |       |
          |       +---> #1125 (Switch frontend to v1/, remove DRF)
          |
          +---> #1126 (DB-level validation, optional)
```

Djoser is removed as part of #1122 (not #1125), since allauth replaces it before Ninja enters the picture.
