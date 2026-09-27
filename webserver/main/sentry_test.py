from unittest import mock

import pytest
import sentry_sdk
from django.test import Client

from main.sentry import drop_sign_in_frame_locals


@pytest.fixture
def sentry_events():
    """Events as they leave before_send; nothing is sent."""
    events: list[dict] = []

    def before_send(event, hint):
        events.append(drop_sign_in_frame_locals(event, hint))

    sentry_sdk.init(dsn="https://key@o1.ingest.sentry.io/1", before_send=before_send)
    yield events
    sentry_sdk.init()


def _frames(event: dict) -> list[dict]:
    return [
        frame
        for exception in event["exception"]["values"]
        for frame in exception["stacktrace"]["frames"]
    ]


@pytest.mark.django_db
def test_a_crash_during_sign_in_reaches_sentry_without_frame_locals(sentry_events):
    """allauth's callback frames hold the client secret and the user's tokens."""
    with (
        mock.patch(
            "allauth.headless.base.views.ConfigView.get", side_effect=RuntimeError
        ),
        pytest.raises(RuntimeError),
    ):
        Client().get("/_allauth/browser/v1/config")

    (event,) = sentry_events
    assert _frames(event)
    assert not any("vars" in frame for frame in _frames(event))


@pytest.mark.django_db
def test_other_crashes_keep_their_frame_locals(sentry_events):
    with (
        mock.patch("main.views.JsonResponse", side_effect=RuntimeError),
        pytest.raises(RuntimeError),
    ):
        Client().get("/health")

    (event,) = sentry_events
    assert any("vars" in frame for frame in _frames(event))
