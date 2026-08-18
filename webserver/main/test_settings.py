import os

from django.core.exceptions import ImproperlyConfigured

from main.settings import *  # noqa: F403


def require_postgres(engine: str, database_url: str) -> None:
    """
    Fail loudly unless the test database is PostgreSQL.

    Dev and production both run PostgreSQL, and main.settings falls back to
    SQLite when DATABASE_URL is unset. That fallback must never reach the test
    suite: SQLite does not enforce varchar lengths, folds case only over ASCII
    in LIKE, and degrades the pg_trgm GIN index on Scene.title to a plain
    B-tree (TrigramExtension is a no-op there), so bugs that fail in
    production can pass here.
    """
    if engine == "django.db.backends.postgresql":
        return
    detail = (
        f"DATABASE_URL resolved to {engine!r}"
        if database_url
        else "DATABASE_URL is not set, so settings fell back to SQLite"
    )
    raise ImproperlyConfigured(
        f"The test suite requires PostgreSQL, but {detail}. Run the tests inside "
        "the webserver container (`just be test` from the repo root), or point "
        "them at the compose database directly: "
        "DATABASE_URL=postgresql://docker:docker@localhost:5431/math3d uv run pytest"  # pragma: allowlist secret
    )


require_postgres(DATABASES["default"]["ENGINE"], ENV.DATABASE_URL)  # noqa: F405

# pytest-django creates a `test_`-prefixed database, so the dev database is
# untouched — but that name is fixed, and Django autoclobbers it. Concurrent
# suites (worktrees, parallel agents) would drop each other's in-flight
# database, so allow each to claim its own.
if test_db_name := os.environ.get("TEST_DB_NAME"):
    if not test_db_name.startswith("test_"):
        # Django drops and recreates this database without prompting, so a name
        # that isn't clearly a test database could destroy the dev one.
        raise ImproperlyConfigured(
            f"TEST_DB_NAME must start with 'test_' (got {test_db_name!r})."
        )
    DATABASES["default"].setdefault("TEST", {})["NAME"] = test_db_name  # noqa: F405

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
