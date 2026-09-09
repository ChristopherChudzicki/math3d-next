import pytest
from django.conf import settings

TEST_SETTINGS_MODULE = "main.test_settings"


def pytest_configure() -> None:
    """
    pytest-django resolves the settings module as --ds, then
    DJANGO_SETTINGS_MODULE, then the pyproject value, so an exported
    DJANGO_SETTINGS_MODULE runs the whole suite on main.settings: no
    environment isolation, no postgres guard, no TEST_DB_NAME. It is the one
    ambient variable main/test_settings.py cannot defend against itself.
    """
    resolved = settings.SETTINGS_MODULE if settings.configured else None
    if resolved != TEST_SETTINGS_MODULE:
        raise pytest.UsageError(
            f"The suite must run under {TEST_SETTINGS_MODULE}, but pytest-django "
            f"resolved {resolved!r} — most likely from an exported "
            "DJANGO_SETTINGS_MODULE, or from running pytest outside webserver/ "
            "so that its pyproject.toml config is not picked up."
        )
