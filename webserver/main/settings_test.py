import importlib.util
from pathlib import Path

import pytest
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from main.env import EnvConfig
from main.origins import (
    WORKTREE_PORTS,
    cors_allowed_origins,
    csrf_trusted_origins,
    dev_cors_allowed_origins,
)
from main.test_settings import require_postgres

SETTINGS_PATH = Path(__file__).parent / "settings.py"

CSRF_MIDDLEWARE = "django.middleware.csrf.CsrfViewMiddleware"

# Every env var settings.py reads — derived from the EnvConfig schema so it
# cannot drift — cleared before each load so ambient values (docker-compose
# env, developer shells) can't leak into the scenario under test.
SETTINGS_ENV_VARS = list(EnvConfig.model_fields)

# Minimal valid production environment — production is the DEFAULT posture, so
# no flag is needed; tests remove or override entries to exercise each guard.
PROD_ENV = {
    "APP_BASE_URL": "https://app.example.org",
    "CSRF_COOKIE_DOMAIN": ".example.org",
    "DATABASE_URL": "postgres://u:p@db.example.org:5432/math3d",  # pragma: allowlist secret
    "GOOGLE_CLIENT_ID": "prod-client-id.apps.googleusercontent.com",
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


def test_production_hardening_is_the_default(monkeypatch):
    """Secure by default: hardening applies unless a deploy explicitly opts out."""
    loaded = load_settings(monkeypatch, **PROD_ENV)
    assert loaded.SECURE_SSL_REDIRECT is True
    assert loaded.SECURE_HSTS_SECONDS > 0
    assert loaded.SESSION_COOKIE_SECURE is True
    assert loaded.CSRF_COOKIE_SECURE is True


def test_bare_environment_fails_closed(monkeypatch):
    """
    An entirely unconfigured environment must refuse to boot (it defaults to
    production and trips the required-config guards) rather than silently
    start with dev-grade security (issue #1130).
    """
    with pytest.raises(ImproperlyConfigured):
        load_settings(monkeypatch)


def test_local_dev_opt_out_relaxes_cookie_security(monkeypatch):
    loaded = load_settings(monkeypatch, IS_DEVELOPMENT="True")
    assert loaded.SESSION_COOKIE_SECURE is False
    assert loaded.CSRF_COOKIE_SECURE is False
    assert not getattr(loaded, "SECURE_SSL_REDIRECT", False)


def test_is_heroku_with_dev_opt_out_is_contradictory(monkeypatch):
    """
    IS_HEROKU (the legacy prod flag) combined with an explicit IS_DEVELOPMENT
    opt-out is contradictory config — refuse to guess which one is stale.
    """
    with pytest.raises(ImproperlyConfigured, match="IS_DEVELOPMENT"):
        load_settings(monkeypatch, **PROD_ENV, IS_HEROKU="True", IS_DEVELOPMENT="True")


def test_legacy_is_heroku_alone_still_gets_hardened(monkeypatch):
    """
    An app still carrying the legacy IS_HEROKU config var (and nothing else
    new) lands on the production default — the migration cannot degrade it.
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


def test_production_requires_database_url(monkeypatch):
    """
    Unset, Django falls back to its dummy backend, which boots fine and then
    fails every query — so production must fail at import instead.
    """
    env = {**PROD_ENV}
    del env["DATABASE_URL"]
    with pytest.raises(ImproperlyConfigured, match="DATABASE_URL"):
        load_settings(monkeypatch, **env)


def test_production_requires_google_client_id(monkeypatch):
    """
    Empty, the Google app's client_id matches no ID token's `aud` and allauth
    rejects every sign-in with client_id_mismatch, so production must fail at
    import instead of serving a button that cannot work.
    """
    env = {**PROD_ENV}
    del env["GOOGLE_CLIENT_ID"]
    with pytest.raises(ImproperlyConfigured, match="GOOGLE_CLIENT_ID"):
        load_settings(monkeypatch, **env)


def test_database_url_configures_the_default_connection(monkeypatch):
    loaded = load_settings(monkeypatch, **PROD_ENV)
    assert loaded.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"


def test_dev_without_database_url_configures_no_engine(monkeypatch):
    """
    An empty config is how Django is told to use its dummy backend, which keeps
    DB-free commands (makemigrations, dump_openapi_*) working while any query
    fails loudly.
    """
    loaded = load_settings(monkeypatch, IS_DEVELOPMENT="True")
    assert loaded.DATABASES["default"] == {}


def test_csrf_cookie_domain_must_cover_spa_host(monkeypatch):
    """
    Cookie auth only works because the SPA and API share a registrable
    domain; a CSRF_COOKIE_DOMAIN that doesn't cover the SPA host means the
    SPA can never read the CSRF token.
    """
    with pytest.raises(ImproperlyConfigured, match="CSRF_COOKIE_DOMAIN"):
        load_settings(
            monkeypatch, **{**PROD_ENV, "CSRF_COOKIE_DOMAIN": ".unrelated.example"}
        )


def test_rate_limit_disable_rejected_outside_development(monkeypatch):
    """
    DISABLE_ALLAUTH_RATE_LIMITS must be rejected on any deploy that is not an
    explicit development opt-out, not just under a hosting flag (issue #1130).
    """
    with pytest.raises(ImproperlyConfigured, match="DISABLE_ALLAUTH_RATE_LIMITS"):
        load_settings(monkeypatch, **PROD_ENV, DISABLE_ALLAUTH_RATE_LIMITS="True")


def test_rate_limit_disable_allowed_in_local_dev(monkeypatch):
    loaded = load_settings(
        monkeypatch, IS_DEVELOPMENT="True", DISABLE_ALLAUTH_RATE_LIMITS="True"
    )
    assert loaded.ACCOUNT_RATE_LIMITS is False


def test_csrf_disable_rejected_outside_development(monkeypatch):
    """
    DISABLE_CSRF exists for one manual test on bare localhost (ADR-0005); a
    deploy reaching real users must refuse to boot with it set.
    """
    with pytest.raises(ImproperlyConfigured, match="DISABLE_CSRF"):
        load_settings(monkeypatch, **PROD_ENV, DISABLE_CSRF="True")


def test_csrf_disable_removes_the_middleware_in_local_dev(monkeypatch):
    default = load_settings(monkeypatch, IS_DEVELOPMENT="True")
    assert CSRF_MIDDLEWARE in default.MIDDLEWARE  # else the assertion below is vacuous
    loaded = load_settings(monkeypatch, IS_DEVELOPMENT="True", DISABLE_CSRF="True")
    assert CSRF_MIDDLEWARE not in loaded.MIDDLEWARE


def test_local_dev_unions_explicit_cors_origins_with_defaults(monkeypatch):
    """
    A local CORS override (e.g. trusting the legacy frontend's dev server)
    must extend the derived defaults, not replace them — otherwise setting it
    silently un-trusts the main dev frontend and worktree ports.
    """
    loaded = load_settings(
        monkeypatch,
        IS_DEVELOPMENT="True",
        APP_BASE_URL="http://math3d.localdev:3000",
        CORS_ALLOWED_ORIGINS="http://localhost:3141",
    )
    assert "http://localhost:3141" in loaded.CORS_ALLOWED_ORIGINS
    assert "http://math3d.localdev:3000" in loaded.CORS_ALLOWED_ORIGINS


def test_production_cors_origins_are_exactly_the_explicit_config(monkeypatch):
    loaded = load_settings(
        monkeypatch, **PROD_ENV, CORS_ALLOWED_ORIGINS="https://app.example.org"
    )
    assert loaded.CORS_ALLOWED_ORIGINS == ["https://app.example.org"]


def test_app_base_url_must_be_a_bare_origin(monkeypatch):
    """
    APP_BASE_URL is used verbatim as a CORS/CSRF origin, and a browser's
    Origin header never carries a path — a path-bearing or scheme-less value
    would boot fine and then silently fail every credentialed request.
    """
    for bad in ["https://app.example.org/app", "app.example.org"]:
        with pytest.raises(ImproperlyConfigured, match="APP_BASE_URL"):
            load_settings(monkeypatch, IS_DEVELOPMENT="True", APP_BASE_URL=bad)


def test_csrf_cookie_domain_coverage_is_case_insensitive(monkeypatch):
    """Domain matching is case-insensitive; unusual casing must not fail boot."""
    loaded = load_settings(
        monkeypatch, **{**PROD_ENV, "CSRF_COOKIE_DOMAIN": ".Example.org"}
    )
    assert loaded.CSRF_COOKIE_DOMAIN == ".Example.org"


def test_csrf_cookie_domain_covers_subdomains_without_leading_dot(monkeypatch):
    """
    Browsers ignore a leading dot on the cookie Domain attribute (RFC 6265):
    'example.org' covers app.example.org just like '.example.org' does.
    """
    loaded = load_settings(
        monkeypatch, **{**PROD_ENV, "CSRF_COOKIE_DOMAIN": "example.org"}
    )
    assert loaded.CSRF_COOKIE_DOMAIN == "example.org"


def test_app_base_url_trailing_slash_is_normalized(monkeypatch):
    """
    A trailing slash on APP_BASE_URL must not corrupt the CSRF/CORS origins
    derived from it (issue #829): a browser's Origin header never carries a
    path, so an un-stripped trailing slash would silently fail to match.
    """
    loaded = load_settings(
        monkeypatch, IS_DEVELOPMENT="True", APP_BASE_URL="http://math3d.localdev:3000/"
    )
    assert loaded.APP_BASE_URL == "http://math3d.localdev:3000"
    assert "http://math3d.localdev:3000" in loaded.CSRF_TRUSTED_ORIGINS


def test_dev_cors_origins_cover_app_and_worktree_ports():
    """
    Locally the one docker backend serves the main checkout's frontend plus
    git-worktree frontends on sibling ports, all of which must be
    CORS-trusted.
    """
    origins = dev_cors_allowed_origins(
        is_development=True,
        app_base_url="http://math3d.localdev:3000",
    )
    worktree_origins = [f"http://math3d.localdev:{port}" for port in WORKTREE_PORTS]
    assert worktree_origins  # else the equality below is vacuous
    assert origins == ["http://math3d.localdev:3000", *worktree_origins]


def test_dev_cors_origins_empty_in_prod():
    """Production must configure CORS origins explicitly."""
    origins = dev_cors_allowed_origins(
        is_development=False,
        app_base_url="https://app.example.org",
    )
    assert origins == []


def test_dev_cors_origins_empty_without_app_base_url():
    origins = dev_cors_allowed_origins(is_development=True, app_base_url="")
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
        is_development=False,
        app_base_url="https://app.example.org",
        cors_allowed_origins=["https://app.example.org", "https://partner.example"],
    )
    assert origins == ["https://app.example.org"]


def test_local_csrf_trust_covers_cors_origins():
    """
    Local worktree frontends on alternate ports make credentialed writes, so
    every CORS origin must also pass Django's CSRF origin check.
    """
    origins = csrf_trusted_origins(
        is_development=True,
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


def test_prod_credentialed_cors_is_exactly_the_spa_origin(monkeypatch):
    """
    Adding a read-only CORS consumer in production must not let it make
    credentialed requests — same principle as CSRF trust (issue #1184).
    """
    loaded = load_settings(
        monkeypatch, **PROD_ENV, CORS_ALLOWED_ORIGINS="https://legacy.example.org"
    )
    assert loaded.CREDENTIALED_CORS_ORIGINS == ["https://app.example.org"]
    assert "https://legacy.example.org" in loaded.CORS_ALLOWED_ORIGINS


def test_dev_credentialed_cors_covers_all_cors_origins(monkeypatch):
    """
    Local worktree frontends (and any explicitly configured dev origins) make
    credentialed requests, so in dev every CORS origin keeps credentials.
    """
    loaded = load_settings(
        monkeypatch,
        IS_DEVELOPMENT="True",
        APP_BASE_URL="http://math3d.localdev:3000",
        CORS_ALLOWED_ORIGINS="http://localhost:3141",
    )
    assert set(loaded.CORS_ALLOWED_ORIGINS) <= set(loaded.CREDENTIALED_CORS_ORIGINS)


def test_local_csrf_trust_handles_unset_app_base_url():
    origins = csrf_trusted_origins(
        is_development=True,
        app_base_url="",
        cors_allowed_origins=["http://math3d.localdev:3000"],
    )
    assert origins == ["http://math3d.localdev:3000"]


@pytest.mark.parametrize(
    ("database_url", "expected"),
    [
        ("", "DATABASE_URL is not set"),
        ("sqlite:////tmp/db.sqlite3", "DATABASE_URL resolved to"),
    ],
)
def test_require_postgres_rejects_sqlite(database_url, expected):
    """
    The two cases report differently because an unset DATABASE_URL needs
    different remediation than one explicitly pointing elsewhere. The accepting
    case needs no test: it runs at settings import, so inverting it goes red.
    """
    with pytest.raises(ImproperlyConfigured) as exc_info:
        require_postgres("django.db.backends.sqlite3", database_url)
    assert expected in str(exc_info.value)


def test_screenshots_config_reads_env_and_caps(monkeypatch):
    module = load_settings(
        monkeypatch,
        **PROD_ENV,
        SCREENSHOTS_ORIGIN="https://s.math3d.org",
        RENDER_SECRET="shh",  # pragma: allowlist secret
    )
    assert module.SCREENSHOTS_ORIGIN == "https://s.math3d.org"
    assert module.RENDER_SECRET == "shh"  # pragma: allowlist secret
    assert module.RENDER_MONTHLY_CAP == 1500
    assert module.RENDER_DAILY_CAP == 150


def test_sentry_not_initialized_without_a_dsn(monkeypatch):
    """Dev, CI, and tests run with no DSN — init must be a no-op there."""
    init_calls = []
    monkeypatch.setattr("sentry_sdk.init", lambda **kwargs: init_calls.append(kwargs))
    load_settings(monkeypatch, IS_DEVELOPMENT="True")
    assert init_calls == []


def test_sentry_initialized_with_no_pii_and_full_tracing(monkeypatch):
    init_calls = []
    monkeypatch.setattr("sentry_sdk.init", lambda **kwargs: init_calls.append(kwargs))
    load_settings(
        monkeypatch,
        IS_DEVELOPMENT="True",
        SENTRY_DSN="https://abc123@o1.ingest.sentry.io/42",
        APP_VERSION="1.2.3",
    )
    assert len(init_calls) == 1
    kwargs = init_calls[0]
    assert kwargs["send_default_pii"] is False
    assert kwargs["traces_sample_rate"] == 1.0
    assert kwargs["environment"] == "production"
    assert kwargs["release"] == "1.2.3"
    assert kwargs["dsn"] == "https://abc123@o1.ingest.sentry.io/42"


def test_dummy_provider_is_development_only(monkeypatch):
    """
    The dummy provider mints a session from an unsigned payload — anyone who can
    reach it can become any user. IS_DEVELOPMENT is the entire guard; a
    dedicated flag was rejected because it could hold no value IS_DEVELOPMENT
    does not already imply (production sets SESSION_COOKIE_SECURE
    unconditionally).
    """
    dev = load_settings(monkeypatch, IS_DEVELOPMENT="True")
    assert "allauth.socialaccount.providers.dummy" in dev.INSTALLED_APPS

    prod = load_settings(monkeypatch, **PROD_ENV)
    assert "allauth.socialaccount.providers.dummy" not in prod.INSTALLED_APPS


def test_password_urls_are_not_registered():
    """SOCIALACCOUNT_ONLY unregisters allauth's password endpoints
    (allauth/headless/account/urls.py). Pin it: the SPA has no password UI, and
    a stray reachable signup URL would let an account be created that the
    sign-in dialog cannot then log into."""
    from django.urls import NoReverseMatch, reverse

    for name in ("headless:browser:account:login", "headless:browser:account:signup"):
        with pytest.raises(NoReverseMatch):
            reverse(name)


def test_google_app_reads_the_client_id_from_the_environment(monkeypatch):
    loaded = load_settings(
        monkeypatch,
        **{**PROD_ENV, "GOOGLE_CLIENT_ID": "abc.apps.googleusercontent.com"},
    )
    app = loaded.SOCIALACCOUNT_PROVIDERS["google"]["APP"]
    assert app["client_id"] == "abc.apps.googleusercontent.com"
    # The popup flow verifies ID tokens against Google's certs and never
    # exchanges an authorization code, so there is no secret to hold.
    assert app["secret"] == ""


def test_provider_identities_are_never_linked_by_email(monkeypatch):
    """
    Email-based linking would let anyone who controls an address take over the
    matching account. allauth resolves it at two levels: the global setting is
    OR'd with a per-provider EMAIL_AUTHENTICATION key, and a lowercase
    email_authentication inside APP["settings"] short-circuits both
    (socialaccount/adapter.py:347-359). Asserting only the global would pass
    vacuously while a provider-level key silently re-enabled it.
    """
    loaded = load_settings(monkeypatch, **PROD_ENV)
    assert loaded.SOCIALACCOUNT_EMAIL_AUTHENTICATION is False
    assert loaded.SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT is False
    google = loaded.SOCIALACCOUNT_PROVIDERS["google"]
    assert "EMAIL_AUTHENTICATION" not in google
    assert "email_authentication" not in google["APP"].get("settings", {})
