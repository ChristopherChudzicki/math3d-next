import pytest
from django.test import Client

from authentication.factories import FACTORY_PASSWORD, CustomUserFactory
from authentication.models import CustomUser

ME_URL = "/v1/auth/users/me/"
DELETE_URL = "/v1/auth/users/me/delete/"
ACTIVATION_URL = "/v1/auth/users/activation/"


@pytest.mark.django_db
def test_me_get_requires_auth():
    assert Client().get(ME_URL).status_code == 403


@pytest.mark.django_db
def test_me_get_returns_user_shape():
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.get(ME_URL)
    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "email": user.email,
        "public_nickname": user.public_nickname,  # snake_case on the wire
    }


@pytest.mark.django_db
def test_me_get_seeds_csrf_cookie():
    # force_login bypasses CSRF *enforcement*, so this cannot catch a missing CSRF
    # check — but it DOES guard the get_token() seed (the cookie the SPA relies on).
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.get(ME_URL)
    assert "csrftoken" in response.cookies


@pytest.mark.django_db
def test_me_patch_updates_public_nickname_and_ignores_readonly_fields():
    user = CustomUserFactory.create()
    original_email = user.email
    client = Client()
    client.force_login(user)
    response = client.patch(
        ME_URL,
        data={"public_nickname": "newnick", "email": "hacked@example.com"},
        content_type="application/json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.public_nickname == "newnick"
    assert user.email == original_email  # id/email read-only (not in UserUpdateSchema)


@pytest.mark.django_db
def test_delete_missing_password_returns_400():
    # A schema-validation failure routes through the ValidationError handler (422→400).
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.post(DELETE_URL, data={}, content_type="application/json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_delete_wrong_password_returns_400_body():
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.post(
        DELETE_URL,
        data={"current_password": "wrong"},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json() == {"current_password": ["Invalid password."]}


@pytest.mark.django_db
def test_delete_correct_password_removes_account():
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.post(
        DELETE_URL,
        data={"current_password": FACTORY_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 204
    assert not CustomUser.objects.filter(id=user.id).exists()


@pytest.mark.django_db
def test_activation_requires_admin():
    user = CustomUserFactory.create()  # non-staff
    client = Client()
    client.force_login(user)
    response = client.post(
        ACTIVATION_URL, data={"email": "x@example.com"}, content_type="application/json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_activation_unknown_email_returns_empty_404():
    admin = CustomUserFactory.create(is_staff=True)
    client = Client()
    client.force_login(admin)
    response = client.post(
        ACTIVATION_URL,
        data={"email": "nobody@example.com"},
        content_type="application/json",
    )
    assert response.status_code == 404
    assert response.content == b""
