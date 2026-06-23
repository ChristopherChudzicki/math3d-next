import pytest
from django.test import Client


@pytest.mark.django_db
def test_v1_openapi_schema_is_served_and_is_31():
    response = Client().get("/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["openapi"].startswith("3.1")
