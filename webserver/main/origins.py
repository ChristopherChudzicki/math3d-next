from urllib.parse import urlparse

# Frontend ports git worktrees may claim (scripts/setup_worktree_env.sh
# allocates from this range; keep the two in sync). Port 3000 is the main
# checkout's dev server; 3001 is skipped because the legacy app's dev server
# owns it (and serves on localhost, so it is not a CORS consumer).
WORKTREE_PORTS = range(3002, 3010)


def default_cors_allowed_origins(*, is_heroku: bool, app_base_url: str) -> list[str]:
    """
    Compute CORS_ALLOWED_ORIGINS when none are configured explicitly.

    In local dev, one backend serves the main checkout's frontend
    (APP_BASE_URL) plus git-worktree frontends on sibling ports, so trust
    APP_BASE_URL's origin and its WORKTREE_PORTS siblings.

    In production, origins must be configured explicitly; default to none.
    """
    if is_heroku or not app_base_url:
        return []
    base = urlparse(app_base_url)
    return [app_base_url] + [
        f"{base.scheme}://{base.hostname}:{port}" for port in WORKTREE_PORTS
    ]


def csrf_trusted_origins(
    *,
    is_heroku: bool,
    app_base_url: str,
    cors_allowed_origins: list[str],
) -> list[str]:
    """
    Compute CSRF_TRUSTED_ORIGINS.

    In production, only the SPA origin may pass Django's CSRF origin check.
    Deliberately NOT derived from the CORS origins: adding a read-only CORS
    consumer must not grant it CSRF-trusted write access.

    In local dev, alternate frontend ports (git worktrees, see
    scripts/setup_worktree_env.sh) make credentialed writes, so every CORS
    origin must also pass the CSRF origin check.
    """
    if is_heroku:
        return [app_base_url]
    return list(
        dict.fromkeys(([app_base_url] if app_base_url else []) + cors_allowed_origins)
    )
