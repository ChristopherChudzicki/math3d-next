from django.conf import settings

from main.origins import csrf_trusted_origins, default_cors_allowed_origins


def test_default_cors_origins_cover_app_and_worktree_ports():
    """
    Locally the one docker backend serves the main checkout's frontend plus
    git-worktree frontends on sibling ports, all of which must be
    CORS-trusted. 3001 is excluded: the legacy app's dev server owns that
    port and is not a CORS consumer.
    """
    origins = default_cors_allowed_origins(
        is_heroku=False,
        app_base_url="http://math3d.localdev:3000",
    )
    assert origins == [
        "http://math3d.localdev:3000",
        *(f"http://math3d.localdev:{port}" for port in range(3002, 3010)),
    ]


def test_default_cors_origins_empty_in_prod():
    """Production must configure CORS origins explicitly."""
    origins = default_cors_allowed_origins(
        is_heroku=True,
        app_base_url="https://next.math3d.org",
    )
    assert origins == []


def test_default_cors_origins_empty_without_app_base_url():
    origins = default_cors_allowed_origins(is_heroku=False, app_base_url="")
    assert origins == []


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
        is_heroku=True,
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
        is_heroku=False,
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
        is_heroku=False,
        app_base_url="",
        cors_allowed_origins=["http://math3d.localdev:3000"],
    )
    assert origins == ["http://math3d.localdev:3000"]
