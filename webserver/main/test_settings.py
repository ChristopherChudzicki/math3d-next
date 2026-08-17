from django.core.exceptions import ImproperlyConfigured

from main.settings import *  # noqa: F403

# Tests run against PostgreSQL, the engine used in local dev and production.
# main.settings falls back to SQLite when DATABASE_URL is unset; that fallback
# must never silently apply to the test suite, because SQLite's laxer semantics
# (unenforced varchar lengths, deferred/absent constraint behavior, different
# LIKE case-sensitivity and ordering) let bugs pass here that fail in prod.
# pytest-django creates a separate `test_`-prefixed database, so this does not
# touch the dev database named in DATABASE_URL.
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":  # noqa: F405
    raise ImproperlyConfigured(
        "The test suite requires PostgreSQL, but DATABASE_URL resolved to "
        f"{DATABASES['default']['ENGINE']!r}. "  # noqa: F405
        "Run the tests inside the webserver container (`just be test` from the "
        "repo root), which sets DATABASE_URL to the compose `db` service."
    )

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
