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
    DATABASE_URL: str = ""
    INGESTION_DATABASE_URL: str = ""
    # NoDecode: these env vars hold comma-separated lists, not JSON — skip
    # pydantic-settings' JSON pre-parse and let the field validator split them.
    ALLOWED_HOSTS: Annotated[list[str], NoDecode] = []
    CORS_ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = []
    # Deployment environment. IS_PRODUCTION drives all production hardening
    # and DEFAULTS TO TRUE: an unconfigured deploy is secure (or fails loudly
    # on the required-config guards); dev environments opt out explicitly via
    # IS_PRODUCTION=False (.env.development, CI). IS_HEROKU is the deprecated
    # predecessor, read only to reject contradictory config.
    IS_PRODUCTION: bool = True
    IS_HEROKU: bool = False
    # Logging
    LOG_LEVEL: str = "INFO"
    DJANGO_LOG_LEVEL: str = "INFO"
    # Version
    APP_VERSION: str = "unknown"
    # Feature flags
    ENABLE_REGISTRATION: bool = False
    CSRF_COOKIE_DOMAIN: str = ""
    DISABLE_ALLAUTH_RATE_LIMITS: bool = False

    @field_validator("ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("APP_BASE_URL")
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
                f"APP_BASE_URL {value!r} must be a bare origin — scheme://host[:port] "
                "with no path, e.g. https://next.math3d.org"
            )
        return value

    @model_validator(mode="after")
    def _reject_contradictory_legacy_flag(self) -> "EnvConfig":
        if self.IS_HEROKU and not self.IS_PRODUCTION:
            raise ValueError(
                "Contradictory config: IS_HEROKU (the deprecated production flag) "
                "is set but IS_PRODUCTION is explicitly False. Remove IS_HEROKU; "
                "production hardening is now the default."
            )
        return self

    @model_validator(mode="after")
    def _require_production_config(self) -> "EnvConfig":
        if self.IS_PRODUCTION:
            if not self.APP_BASE_URL:
                raise ValueError(
                    "APP_BASE_URL is required in production (used for "
                    "CSRF_TRUSTED_ORIGINS and email links)."
                )
            if not self.CSRF_COOKIE_DOMAIN:
                raise ValueError(
                    "CSRF_COOKIE_DOMAIN is required in production; without it the "
                    "SPA cannot read the CSRF token and all authenticated writes "
                    "fail."
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
