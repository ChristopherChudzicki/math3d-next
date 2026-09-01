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
    # The SPA origin, e.g. https://next.math3d.org. Validated to a bare origin
    # (and trailing-slash-normalized) because it is used verbatim as an origin
    # (CORS/CSRF trust), where a browser's Origin header never carries a path.
    APP_BASE_URL: str = ""
    # Bare origin of the screenshots render Worker, e.g.
    # https://math3d-screenshots.<sub>.workers.dev. The reservation nudge POSTs
    # to `{SCREENSHOTS_ORIGIN}/render` with a bearer secret; validated to a bare
    # origin (no path) so the secret isn't sent to an unexpected path, and
    # trailing-slash-normalized. Unset ⇒ the render feature is dark.
    SCREENSHOTS_ORIGIN: str = ""
    # Shared secret gating the Worker's POST /render. Unset in dev is fine
    # (feature dark). Not required in production — the feature is optional.
    RENDER_SECRET: str = ""
    # Required in production (below). Unset in dev leaves Django on its dummy
    # backend: DB-free commands like makemigrations run, queries fail loudly.
    DATABASE_URL: str = ""
    INGESTION_DATABASE_URL: str = ""
    # NoDecode: these env vars hold comma-separated lists, not JSON — skip
    # pydantic-settings' JSON pre-parse and let the field validator split them.
    ALLOWED_HOSTS: Annotated[list[str], NoDecode] = []
    CORS_ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = []
    # Deployment environment. Production hardening is the DEFAULT: an
    # unconfigured deploy is secure (or fails loudly on the required-config
    # guards). Dev environments opt out explicitly via IS_DEVELOPMENT=True
    # (.env.development, CI); production-like deploys (prod, rc) set nothing.
    # IS_HEROKU is the deprecated production flag, read only to reject
    # contradictory config.
    IS_DEVELOPMENT: bool = False
    IS_HEROKU: bool = False
    # Logging
    LOG_LEVEL: str = "INFO"
    DJANGO_LOG_LEVEL: str = "INFO"
    # Version
    APP_VERSION: str = "unknown"
    # Feature flags
    ENABLE_REGISTRATION: bool = False
    # Google OAuth client ID. Public by design (the SPA embeds it too), so this
    # is config, not a secret. Unset ⇒ the provider is still registered but no
    # sign-in can succeed (an empty `aud` matches no Google token); required in
    # production (see _require_production_config).
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
    def _reject_contradictory_legacy_flag(self) -> "EnvConfig":
        if self.IS_HEROKU and self.IS_DEVELOPMENT:
            raise ValueError(
                "Contradictory config: IS_HEROKU (the deprecated production flag) "
                "is set but IS_DEVELOPMENT is also set. Remove IS_HEROKU; "
                "production hardening is now the default."
            )
        return self

    @model_validator(mode="after")
    def _require_production_config(self) -> "EnvConfig":
        if not self.IS_DEVELOPMENT:
            if not self.APP_BASE_URL:
                raise ValueError(
                    "APP_BASE_URL is required in production (used for "
                    "CSRF_TRUSTED_ORIGINS)."
                )
            if not self.CSRF_COOKIE_DOMAIN:
                raise ValueError(
                    "CSRF_COOKIE_DOMAIN is required in production; without it the "
                    "SPA cannot read the CSRF token and all authenticated writes "
                    "fail."
                )
            if not self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL is required in production; without it Django "
                    "falls back to a dummy backend that fails on every query."
                )
            if not self.GOOGLE_CLIENT_ID:
                raise ValueError(
                    "GOOGLE_CLIENT_ID is required in production; empty, the "
                    "Google app's client_id matches no ID token and every "
                    "sign-in fails."
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
