import os
from collections.abc import MutableMapping

from django.core.exceptions import ImproperlyConfigured

from main.env import EnvConfig

# The suite is pointed at a database from outside (`just be test`, CI, the
# worktree invocation in CLAUDE.md), and which database that is says nothing
# about how the app behaves.
PRESERVED_ENV_VARS = frozenset({"DATABASE_URL"})

# Production posture would 301 every test-client request through
# SECURE_SSL_REDIRECT, and EnvConfig's production guards refuse to boot without
# APP_BASE_URL, CSRF_COOKIE_DOMAIN and DATABASE_URL. With DATABASE_URL that
# makes the suite's environment identical to the CI job's.
PINNED_ENV = {"IS_DEVELOPMENT": "True"}


def isolate_environ(environ: MutableMapping[str, str]) -> None:
    """
    Clear every variable settings.py reads bar the preserved ones, then apply
    the suite's pinned values, so a run's outcome is the same on CI and on a
    developer machine.
    Otherwise a documented local-dev flag silently invalidates tests: with
    DISABLE_CSRF (ADR-0005) set, settings.py drops CsrfViewMiddleware and
    ninja_auth builds SessionAuth(csrf=False), so the CSRF assertions in
    authentication/api_test.py cannot hold.

    Deriving the list from EnvConfig means a variable added later is isolated
    without anyone remembering to add it here. A test wanting a non-default
    value overrides it explicitly (see main/ninja_auth_test.py).
    """
    for name in EnvConfig.model_fields:
        if name not in PRESERVED_ENV_VARS:
            environ.pop(name, None)
    environ.update(PINNED_ENV)


isolate_environ(os.environ)

from main.settings import *  # noqa: E402, F403


def require_postgres(engine: str, database_url: str) -> None:
    """
    Fail loudly unless the test database is PostgreSQL, as dev and production
    are. Another engine hides bugs that would fail in production, and an unset
    DATABASE_URL leaves Django's dummy backend, which lets the suite start and
    then fails every query with a generic message.
    """
    if engine == "django.db.backends.postgresql":
        return
    detail = (
        f"DATABASE_URL resolved to {engine!r}"
        if database_url
        else "DATABASE_URL is not set, so there is no configured database"
    )
    raise ImproperlyConfigured(
        f"The test suite requires PostgreSQL, but {detail}. Run the tests inside "
        "the webserver container (`just be test` from the repo root), or point "
        "them at the compose database directly: "
        "DATABASE_URL=postgresql://docker:docker@localhost:5431/math3d uv run pytest"  # pragma: allowlist secret
    )


require_postgres(DATABASES["default"].get("ENGINE", ""), ENV.DATABASE_URL)  # noqa: F405

# The test database name is otherwise fixed, and Django autoclobbers it, so
# concurrent suites (worktrees, parallel agents) would drop each other's.
if test_db_name := os.environ.get("TEST_DB_NAME"):
    if not test_db_name.startswith("test_"):
        # Guards against pointing the autoclobber at the dev database.
        raise ImproperlyConfigured(
            f"TEST_DB_NAME must start with 'test_' (got {test_db_name!r})."
        )
    DATABASES["default"].setdefault("TEST", {})["NAME"] = test_db_name  # noqa: F405

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
