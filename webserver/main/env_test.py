import pytest
from pydantic import ValidationError

from main.env import EnvConfig


def _base(**overrides):
    # IS_DEVELOPMENT=True skips the production-required-config guards, isolating
    # the field under test.
    return EnvConfig(IS_DEVELOPMENT=True, **overrides)


def test_screenshots_origin_defaults_empty():
    assert _base().SCREENSHOTS_ORIGIN == ""


def test_screenshots_origin_strips_trailing_slash():
    assert _base(SCREENSHOTS_ORIGIN="https://s.math3d.org/").SCREENSHOTS_ORIGIN == (
        "https://s.math3d.org"
    )


def test_screenshots_origin_rejects_non_bare_origin():
    # Shares one validator with APP_BASE_URL (whose path/query/no-scheme branches
    # are already pinned by its own tests); one row proves SCREENSHOTS_ORIGIN is
    # wired to that validator.
    with pytest.raises(ValidationError):
        _base(SCREENSHOTS_ORIGIN="https://s.math3d.org/render")


def test_render_secret_defaults_empty():
    assert _base().RENDER_SECRET == ""


def test_sentry_dsn_defaults_empty():
    assert _base().SENTRY_DSN == ""


def test_sentry_dsn_rejects_a_malformed_dsn():
    # sentry_sdk.init() raises BadDsn at settings-import time, which would be an
    # unhandled gunicorn boot failure; this validator turns it into the same
    # ImproperlyConfigured path as every other bad config value.
    with pytest.raises(ValidationError):
        _base(SENTRY_DSN="not-a-dsn")
