import importlib

import pytest

import main.ninja_auth


@pytest.fixture
def reload_ninja_auth(settings):
    """
    The auth objects read DISABLE_CSRF once, when the module is imported, so a
    settings override only shows up after a reload. Reload again on teardown so
    the module's objects match the restored settings.
    """

    def reload_with(disable_csrf: bool):
        settings.DISABLE_CSRF = disable_csrf
        return importlib.reload(main.ninja_auth)

    yield reload_with
    settings.DISABLE_CSRF = False
    importlib.reload(main.ninja_auth)


def test_cookie_auth_enforces_csrf_by_default(reload_ninja_auth):
    """
    The v1 API's CSRF enforcement lives in django-ninja, not in MIDDLEWARE, so
    it needs its own assertion — removing the middleware would not fail here.
    """
    reloaded = reload_ninja_auth(False)
    assert reloaded.session_auth.csrf is True
    assert reloaded.staff_auth.csrf is True


def test_disable_csrf_reaches_cookie_auth(reload_ninja_auth):
    """Both auth objects, or the flag leaves half the API enforcing (ADR-0005)."""
    reloaded = reload_ninja_auth(True)
    assert reloaded.session_auth.csrf is False
    assert reloaded.staff_auth.csrf is False
