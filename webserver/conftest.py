import pytest
import sentry_sdk
from django.conf import settings
from sentry_sdk.transport import Transport

from main.sentry import drop_sign_in_frame_locals

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


class _DiscardTransport(Transport):
    def capture_envelope(self, envelope):
        pass


@pytest.fixture
def sentry_events():
    """Events as they leave before_send; nothing is sent."""
    events: list[dict] = []

    def before_send(event, hint):
        event = drop_sign_in_frame_locals(event, hint)
        events.append(event)
        # Returning the event keeps it "sent", so last_event_id() names it.
        return event

    sentry_sdk.init(
        dsn="https://key@o1.ingest.sentry.io/1",
        before_send=before_send,
        transport=_DiscardTransport,
    )
    yield events
    sentry_sdk.init()
