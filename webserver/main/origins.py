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
