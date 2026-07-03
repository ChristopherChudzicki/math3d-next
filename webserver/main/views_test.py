from django.test import Client, override_settings


@override_settings(APP_VERSION="2026.07.03.1")
def test_health_endpoint_reports_ok_and_version():
    response = Client().get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "2026.07.03.1"}
