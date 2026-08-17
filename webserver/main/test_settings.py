import os

from django.core.exceptions import ImproperlyConfigured

from main.settings import *  # noqa: F403


def require_postgres(engine: str) -> None:
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
        if os.environ.get("DATABASE_URL")
        else "DATABASE_URL is not set, so settings fell back to SQLite"
    )
    raise ImproperlyConfigured(
        f"The test suite requires PostgreSQL, but {detail}. Run the tests inside "
        "the webserver container (`just be test` from the repo root), or point "
        "them at the compose database directly: "
        "DATABASE_URL=postgresql://docker:docker@localhost:5431/math3d uv run pytest"  # pragma: allowlist secret
    )


require_postgres(DATABASES["default"]["ENGINE"])  # noqa: F405

# pytest-django creates a `test_`-prefixed database, so the dev database is
# untouched — but that name is fixed, and Django autoclobbers it on startup.
# Concurrent suites (worktrees, parallel agents) would drop each other's
# in-flight database, so allow each to claim its own.
if test_db_name := os.environ.get("TEST_DB_NAME"):
    DATABASES["default"]["TEST"] = {"NAME": test_db_name}  # noqa: F405

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
