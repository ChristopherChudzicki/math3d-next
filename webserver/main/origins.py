from urllib.parse import urlparse

# Frontend ports git worktrees may claim (scripts/setup_worktree_env.sh
# allocates from this range; keep the two in sync). Port 3000 is the main
# checkout's dev server. The legacy math3d-react app is a genuine cross-origin
# CORS consumer (it runs on its own port and posts to /v1/legacy_scenes/); its
# origin is added per-developer via the CORS_ALLOWED_ORIGINS env var rather
# than baked in here.
WORKTREE_PORTS = range(3002, 3010)


def dev_cors_allowed_origins(*, is_production: bool, app_base_url: str) -> list[str]:
    """
    Compute the development-only CORS origins (empty in production).

    In local dev, one backend serves the main checkout's frontend
    (APP_BASE_URL) plus git-worktree frontends on sibling ports, so trust
    APP_BASE_URL's origin and its WORKTREE_PORTS siblings. Explicitly
    configured origins (CORS_ALLOWED_ORIGINS) are unioned with these in
    settings.py.

    In production, origins must be configured explicitly; return none.
    """
    if is_production or not app_base_url:
        return []
    base = urlparse(app_base_url)
    return [app_base_url] + [
        f"{base.scheme}://{base.hostname}:{port}" for port in WORKTREE_PORTS
    ]


def cors_allowed_origins(
    *,
    configured: list[str],
    dev: list[str],
) -> list[str]:
    """
    Union of explicitly configured origins (CORS_ALLOWED_ORIGINS) and the
    dev-only origins, order-preserving and de-duplicated.

    Configured origins add to — never replace — the dev defaults, so setting
    CORS_ALLOWED_ORIGINS (e.g. the legacy math3d-react frontend's origin) in a
    local .env can't silently drop the worktree frontend ports. In production
    the dev list is empty, so the result is exactly what's configured.
    """
    return list(dict.fromkeys(configured + dev))


def csrf_trusted_origins(
    *,
    is_production: bool,
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
    if is_production:
        return [app_base_url]
    return list(
        dict.fromkeys(([app_base_url] if app_base_url else []) + cors_allowed_origins)
    )
