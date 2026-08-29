"""
Typed schema for every environment variable the Django settings read.

Field names are the environment variable names. Cross-variable boot guards
live here as model validators, so they are unit-testable by constructing
EnvConfig directly; settings.py translates any ValidationError into Django's
ImproperlyConfigured at import time.
"""

from typing import Annotated
from urllib.parse import urlparse

from django.utils.http import is_same_domain
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sentry_sdk.utils import BadDsn, Dsn


class EnvConfig(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="forbid")

    SECRET_KEY: str = ""
    MAILJET_API_KEY: str = ""
    MAILJET_SECRET_KEY: str = ""
    DEFAULT_FROM_EMAIL: str = ""
    SERVER_EMAIL: str = ""
    # The SPA origin, e.g. https://next.math3d.org. Validated to a bare origin
    # (and trailing-slash-normalized) because paths are appended to it
    # (HEADLESS_FRONTEND_URLS) and it is used verbatim as an origin (CORS/CSRF
    # trust), where a browser's Origin header never carries a path.
    APP_BASE_URL: str = ""
    # Bare origin of the screenshots render Worker, e.g.
    # https://math3d-screenshots.<sub>.workers.dev. The reservation nudge POSTs
    # to `{SCREENSHOTS_ORIGIN}/render` with a bearer secret; validated to a bare
    # origin (no path) so the secret isn't sent to an unexpected path, and
    # trailing-slash-normalized. Unset ⇒ the render feature is dark.
    SCREENSHOTS_ORIGIN: str = ""
    # Shared secret gating the Worker's POST /render. Unset in dev is fine
    # (feature dark). Not required on a deployment — the feature is optional.
    RENDER_SECRET: str = ""
    # Required on a deployment (below). Unset in dev leaves Django on its dummy
    # backend: DB-free commands like makemigrations run, queries fail loudly.
    DATABASE_URL: str = ""
    INGESTION_DATABASE_URL: str = ""
    # NoDecode: these env vars hold comma-separated lists, not JSON — skip
    # pydantic-settings' JSON pre-parse and let the field validator split them.
    ALLOWED_HOSTS: Annotated[list[str], NoDecode] = []
    CORS_ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = []
    # Whether this process serves a deployment (prod, rc). True by default, so
    # an unconfigured deploy is hardened and fails loudly on the checks below
    # rather than silently running with dev-grade security. Anything that is
    # not a deployment — a developer machine, CI, a schema dump — opts out
    # explicitly with IS_DEPLOYMENT=False.
    IS_DEPLOYMENT: bool = True
    # Logging
    LOG_LEVEL: str = "INFO"
    DJANGO_LOG_LEVEL: str = "INFO"
    # Version
    APP_VERSION: str = "unknown"
    # Feature flags
    ENABLE_REGISTRATION: bool = False
    # Google OAuth client ID. Public by design (the SPA embeds it too), so this
    # is config, not a secret. Unset ⇒ the provider is still registered but no
    # sign-in can succeed (an empty `aud` matches no Google token); required on
    # a deployment (see _require_deployment_config).
    GOOGLE_CLIENT_ID: str = ""
    CSRF_COOKIE_DOMAIN: str = ""
    DISABLE_ALLAUTH_RATE_LIMITS: bool = False
    # Local-only, for hand-testing Google sign-in on bare `localhost`, which
    # cannot carry the domain cookie the SPA reads. See ADR-0005.
    DISABLE_CSRF: bool = False
    # Sentry. Unset ⇒ the SDK is a no-op, which is how dev, CI, and tests run.
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0

    @field_validator("ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("APP_BASE_URL", "SCREENSHOTS_ORIGIN")
    @classmethod
    def _normalize_and_validate_origin(cls, value: str) -> str:
        value = value.rstrip("/")
        if not value:
            return value
        parsed = urlparse(value)
        if (
            parsed.scheme not in ("http", "https")
            or not parsed.hostname
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError(
                f"{value!r} must be a bare origin — scheme://host[:port] with no "
                "path, e.g. https://next.math3d.org"
            )
        return value

    @field_validator("SENTRY_DSN")
    @classmethod
    def _validate_sentry_dsn(cls, value: str) -> str:
        if not value:
            return value
        try:
            Dsn(value)
        except BadDsn as exc:
            raise ValueError(f"{value!r} is not a valid Sentry DSN: {exc}") from exc
        return value

    @model_validator(mode="after")
    def _require_deployment_config(self) -> "EnvConfig":
        """
        Report every missing variable at once. Raising on the first would make
        a misconfigured deploy take one attempt per variable to diagnose.
        """
        if not self.IS_DEPLOYMENT:
            return self
        missing = []
        if not self.APP_BASE_URL:
            missing.append(
                "APP_BASE_URL (used for CSRF_TRUSTED_ORIGINS and email links)"
            )
        if not self.CSRF_COOKIE_DOMAIN:
            missing.append(
                "CSRF_COOKIE_DOMAIN (without it the SPA cannot read the CSRF "
                "token and all authenticated writes fail)"
            )
        if not self.DATABASE_URL:
            missing.append(
                "DATABASE_URL (without it Django falls back to a dummy backend "
                "that fails on every query)"
            )
        if not self.GOOGLE_CLIENT_ID:
            missing.append(
                "GOOGLE_CLIENT_ID (empty, the Google app's client_id matches no "
                "ID token's `aud` and every sign-in fails)"
            )
        if missing:
            raise ValueError(
                "Missing configuration required to run a deployment: "
                + "; ".join(missing)
                + ". Set IS_DEPLOYMENT=False if this is not a deployment."
            )
        return self

    @model_validator(mode="after")
    def _csrf_cookie_domain_must_cover_spa_host(self) -> "EnvConfig":
        """
        Cookie auth requires the SPA (next.math3d.org) and API
        (api.next.math3d.org) to share a registrable domain: default
        SameSite=Lax sends the session cookie, and CSRF_COOKIE_DOMAIN
        (.math3d.org) lets the SPA read the CSRF token. This check makes the
        shared-domain constraint explicit for the CSRF half.
        """
        if self.CSRF_COOKIE_DOMAIN and self.APP_BASE_URL:
            spa_host = urlparse(self.APP_BASE_URL).hostname or ""
            # Browsers ignore a leading dot on the cookie Domain attribute
            # (RFC 6265: "math3d.org" covers subdomains just like
            # ".math3d.org"), whereas is_same_domain only matches subdomains
            # for dotted patterns — so normalize to the dotted form.
            cookie_domain = "." + self.CSRF_COOKIE_DOMAIN.lstrip(".")
            if not is_same_domain(spa_host, cookie_domain):
                raise ValueError(
                    f"CSRF_COOKIE_DOMAIN {self.CSRF_COOKIE_DOMAIN!r} does not "
                    f"cover the SPA host {spa_host!r} (from APP_BASE_URL), so the "
                    "SPA could not read the CSRF token."
                )
        return self
