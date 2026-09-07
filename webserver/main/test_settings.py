import os

import sentry_sdk
from django.core.exceptions import ImproperlyConfigured

from main.settings import *

sentry_sdk.init(dsn=None)  # tests never report, even if SENTRY_DSN is set


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


require_postgres(DATABASES["default"].get("ENGINE", ""), ENV.DATABASE_URL)

# The test database name is otherwise fixed, and Django autoclobbers it, so
# concurrent suites (worktrees, parallel agents) would drop each other's.
if test_db_name := os.environ.get("TEST_DB_NAME"):
    if not test_db_name.startswith("test_"):
        # Guards against pointing the autoclobber at the dev database.
        raise ImproperlyConfigured(
            f"TEST_DB_NAME must start with 'test_' (got {test_db_name!r})."
        )
    DATABASES["default"].setdefault("TEST", {})["NAME"] = test_db_name

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
