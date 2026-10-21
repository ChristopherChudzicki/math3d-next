from unittest import mock

import pytest
from django.test import Client, override_settings


@pytest.mark.django_db
def test_v1_openapi_schema_is_served_and_is_31():
    response = Client().get("/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["openapi"].startswith("3.1")


@pytest.mark.django_db
def test_authentication_error_maps_to_403_forbidden_body():
    # Global handler (main/api.py) maps Ninja's AuthenticationError to a 403 with a
    # DRF-compatible body, instead of Ninja's default 401. Exercised here via an
    # anonymous hit on a session-auth route.
    response = Client().get("/v1/me/scenes/")
    assert response.status_code == 403
    assert response.json() == {"detail": "Forbidden."}


@pytest.mark.django_db
def test_validation_error_maps_to_400_detail_body():
    # Global handler maps Ninja's request-validation failure (default 422) to a 400
    # with a {"detail": [...]} body. An empty create body omits required `items`.
    response = Client().post("/v1/scenes/", data={}, content_type="application/json")
    assert response.status_code == 400
    body = response.json()
    assert set(body.keys()) == {"detail"}
    assert isinstance(body["detail"], list)


@pytest.mark.django_db
@override_settings(
    CORS_ALLOWED_ORIGINS=["http://app.test"],
    CREDENTIALED_CORS_ORIGINS=["http://app.test"],
)
def test_an_unhandled_error_returns_json_naming_its_sentry_event(sentry_events):
    # The SPA can read the body only if the 500 carries the CORS headers too.
    with mock.patch("scenes.api.get_object_or_404", side_effect=RuntimeError):
        response = Client(raise_request_exception=False).get(
            "/v1/scenes/abc/", HTTP_ORIGIN="http://app.test"
        )

    assert response.status_code == 500
    assert response.headers["Access-Control-Allow-Credentials"] == "true"
    (event,) = sentry_events
    assert response.json() == {
        "detail": "Internal server error.",
        "sentry_event_id": event["event_id"],
    }
