from django.test import Client, override_settings


@override_settings(APP_VERSION="2026.07.03.1")
def test_health_endpoint_reports_ok_and_version():
    response = Client().get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "2026.07.03.1"}


def test_health_endpoint_allows_head():
    """Uptime monitors commonly probe with HEAD; require_safe (not require_GET)
    was chosen deliberately to allow it."""
    assert Client().head("/health").status_code == 200


def test_health_endpoint_rejects_unsafe_methods():
    assert Client().post("/health").status_code == 405
