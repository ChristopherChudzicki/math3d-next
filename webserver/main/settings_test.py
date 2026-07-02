from django.conf import settings


def test_csrf_trusted_origins_cover_cors_origins():
    """
    Locally, worktree frontends on alternate ports make credentialed writes,
    so every CORS origin must also pass Django's CSRF origin check.
    """
    assert set(settings.CORS_ALLOWED_ORIGINS) <= set(settings.CSRF_TRUSTED_ORIGINS)
