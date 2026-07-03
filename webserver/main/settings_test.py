import importlib.util
from pathlib import Path

import pytest
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from main.origins import (
    WORKTREE_PORTS,
    cors_allowed_origins,
    csrf_trusted_origins,
    dev_cors_allowed_origins,
)

SETTINGS_PATH = Path(__file__).parent / "settings.py"

# Every env var settings.py reads; cleared before each load so ambient values
# (docker-compose env, developer shells) can't leak into the scenario under test.
SETTINGS_ENV_VARS = [
    "CORS_ALLOWED_ORIGINS",
    "SECRET_KEY",
    "MAILJET_API_KEY",
    "MAILJET_SECRET_KEY",
    "DEFAULT_FROM_EMAIL",
    "SERVER_EMAIL",
    "APP_BASE_URL",
    "INGESTION_DATABASE_URL",
    "ALLOWED_HOSTS",
    "IS_HEROKU",
    "IS_PRODUCTION",
    "LOG_LEVEL",
    "DJANGO_LOG_LEVEL",
    "APP_VERSION",
    "ENABLE_REGISTRATION",
    "CSRF_COOKIE_DOMAIN",
    "DISABLE_ALLAUTH_RATE_LIMITS",
]

# Minimal valid production environment; tests remove or override entries to
# exercise each guard.
PROD_ENV = {
    "IS_PRODUCTION": "True",
    "APP_BASE_URL": "https://next.math3d.org",
    "CSRF_COOKIE_DOMAIN": ".math3d.org",
}


def load_settings(monkeypatch, **env_vars):
    """
    Execute settings.py fresh under a fully controlled environment and return
    the resulting module. Guards raising at import time surface as exceptions.
    """
    for var in SETTINGS_ENV_VARS:
        monkeypatch.delenv(var, raising=False)
    for key, value in env_vars.items():
        monkeypatch.setenv(key, value)
    spec = importlib.util.spec_from_file_location(
        "main_settings_under_test", SETTINGS_PATH
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_production_hardening_driven_by_is_production(monkeypatch):
    loaded = load_settings(monkeypatch, **PROD_ENV)
    assert loaded.SECURE_SSL_REDIRECT is True
    assert loaded.SECURE_HSTS_SECONDS > 0
    assert loaded.SESSION_COOKIE_SECURE is True
    assert loaded.CSRF_COOKIE_SECURE is True


def test_local_dev_relaxes_cookie_security(monkeypatch):
    loaded = load_settings(monkeypatch)
    assert loaded.SESSION_COOKIE_SECURE is False
    assert loaded.CSRF_COOKIE_SECURE is False
    assert not getattr(loaded, "SECURE_SSL_REDIRECT", False)


def test_is_heroku_without_is_production_fails_loudly(monkeypatch):
    """
    A deploy still configured with the legacy IS_HEROKU flag must crash at
    boot rather than silently start with dev-grade security (issue #1130).
    """
    env = {**PROD_ENV, "IS_HEROKU": "True"}
    del env["IS_PRODUCTION"]
    with pytest.raises(ImproperlyConfigured, match="IS_PRODUCTION"):
        load_settings(monkeypatch, **env)


def test_is_heroku_alongside_is_production_is_tolerated(monkeypatch):
    """
    During the config-var migration both flags coexist (the deploy sets
    IS_PRODUCTION before IS_HEROKU is deleted); that must not break boot.
    """
    loaded = load_settings(monkeypatch, **PROD_ENV, IS_HEROKU="True")
    assert loaded.SECURE_SSL_REDIRECT is True


def test_production_requires_app_base_url(monkeypatch):
    env = {**PROD_ENV}
    del env["APP_BASE_URL"]
    with pytest.raises(ImproperlyConfigured, match="APP_BASE_URL"):
        load_settings(monkeypatch, **env)


def test_production_requires_csrf_cookie_domain(monkeypatch):
    """
    Without CSRF_COOKIE_DOMAIN the SPA cannot read the CSRF token and all
    authed mutations fail closed (issue #1130).
    """
    env = {**PROD_ENV}
    del env["CSRF_COOKIE_DOMAIN"]
    with pytest.raises(ImproperlyConfigured, match="CSRF_COOKIE_DOMAIN"):
        load_settings(monkeypatch, **env)


def test_csrf_cookie_domain_must_cover_spa_host(monkeypatch):
    """
    Cookie auth only works because the SPA and API share a registrable
    domain; a CSRF_COOKIE_DOMAIN that doesn't cover the SPA host means the
    SPA can never read the CSRF token.
    """
    with pytest.raises(ImproperlyConfigured, match="CSRF_COOKIE_DOMAIN"):
        load_settings(monkeypatch, **{**PROD_ENV, "CSRF_COOKIE_DOMAIN": ".example.org"})


def test_rate_limit_disable_rejected_when_cookies_secure(monkeypatch):
    """
    DISABLE_ALLAUTH_RATE_LIMITS must be rejected on any secure-cookie (TLS)
    deploy, not just under a particular hosting flag (issue #1130).
    """
    with pytest.raises(ImproperlyConfigured, match="DISABLE_ALLAUTH_RATE_LIMITS"):
        load_settings(monkeypatch, **PROD_ENV, DISABLE_ALLAUTH_RATE_LIMITS="True")


def test_rate_limit_disable_allowed_in_local_dev(monkeypatch):
    loaded = load_settings(monkeypatch, DISABLE_ALLAUTH_RATE_LIMITS="True")
    assert loaded.ACCOUNT_RATE_LIMITS is False


def test_local_dev_unions_explicit_cors_origins_with_defaults(monkeypatch):
    """
    A local CORS override (e.g. trusting the legacy frontend's dev server)
    must extend the derived defaults, not replace them — otherwise setting it
    silently un-trusts the main dev frontend and worktree ports.
    """
    loaded = load_settings(
        monkeypatch,
        APP_BASE_URL="http://math3d.localdev:3000",
        CORS_ALLOWED_ORIGINS="http://localhost:3141",
    )
    assert "http://localhost:3141" in loaded.CORS_ALLOWED_ORIGINS
    assert "http://math3d.localdev:3000" in loaded.CORS_ALLOWED_ORIGINS


def test_production_cors_origins_are_exactly_the_explicit_config(monkeypatch):
    loaded = load_settings(
        monkeypatch, **PROD_ENV, CORS_ALLOWED_ORIGINS="https://next.math3d.org"
    )
    assert loaded.CORS_ALLOWED_ORIGINS == ["https://next.math3d.org"]


def test_app_base_url_trailing_slash_is_normalized(monkeypatch):
    """
    A trailing slash on APP_BASE_URL must not corrupt the auth email links
    built from it (issue #829).
    """
    loaded = load_settings(monkeypatch, APP_BASE_URL="http://math3d.localdev:3000/")
    assert loaded.APP_BASE_URL == "http://math3d.localdev:3000"
    assert (
        loaded.HEADLESS_FRONTEND_URLS["account_confirm_email"]
        == "http://math3d.localdev:3000/?overlay=activate&key={key}"
    )


def test_dev_cors_origins_cover_app_and_worktree_ports():
    """
    Locally the one docker backend serves the main checkout's frontend plus
    git-worktree frontends on sibling ports, all of which must be
    CORS-trusted.
    """
    origins = dev_cors_allowed_origins(
        is_production=False,
        app_base_url="http://math3d.localdev:3000",
    )
    worktree_origins = [f"http://math3d.localdev:{port}" for port in WORKTREE_PORTS]
    assert worktree_origins  # else the equality below is vacuous
    assert origins == ["http://math3d.localdev:3000", *worktree_origins]


def test_dev_cors_origins_empty_in_prod():
    """Production must configure CORS origins explicitly."""
    origins = dev_cors_allowed_origins(
        is_production=True,
        app_base_url="https://next.math3d.org",
    )
    assert origins == []


def test_dev_cors_origins_empty_without_app_base_url():
    origins = dev_cors_allowed_origins(is_production=False, app_base_url="")
    assert origins == []


def test_cors_origins_union_adds_configured_without_dropping_dev():
    """
    A configured origin (e.g. the legacy math3d-react frontend) must add to,
    not replace, the dev defaults — and duplicates collapse.
    """
    origins = cors_allowed_origins(
        configured=["http://localhost:3141", "http://math3d.localdev:3000"],
        dev=["http://math3d.localdev:3000", "http://math3d.localdev:3002"],
    )
    assert origins == [
        "http://localhost:3141",
        "http://math3d.localdev:3000",
        "http://math3d.localdev:3002",
    ]


def test_settings_wire_csrf_trust_from_cors_origins():
    """
    Pins that settings.py actually derives CSRF trust via
    csrf_trusted_origins — the function tests alone would stay green if the
    wiring broke.
    """
    assert set(settings.CORS_ALLOWED_ORIGINS) <= set(settings.CSRF_TRUSTED_ORIGINS)


def test_prod_csrf_trust_ignores_cors_origins():
    """
    Adding a read-only CORS consumer in production must not grant it
    CSRF-trusted write access.
    """
    origins = csrf_trusted_origins(
        is_production=True,
        app_base_url="https://next.math3d.org",
        cors_allowed_origins=["https://next.math3d.org", "https://partner.example"],
    )
    assert origins == ["https://next.math3d.org"]


def test_local_csrf_trust_covers_cors_origins():
    """
    Local worktree frontends on alternate ports make credentialed writes, so
    every CORS origin must also pass Django's CSRF origin check.
    """
    origins = csrf_trusted_origins(
        is_production=False,
        app_base_url="http://math3d.localdev:3000",
        cors_allowed_origins=[
            "http://math3d.localdev:3000",
            "http://math3d.localdev:3002",
        ],
    )
    assert origins == [
        "http://math3d.localdev:3000",
        "http://math3d.localdev:3002",
    ]


def test_local_csrf_trust_handles_unset_app_base_url():
    origins = csrf_trusted_origins(
        is_production=False,
        app_base_url="",
        cors_allowed_origins=["http://math3d.localdev:3000"],
    )
    assert origins == ["http://math3d.localdev:3000"]
