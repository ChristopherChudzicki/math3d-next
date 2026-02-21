from urllib.parse import ParseResult, parse_qs, urlparse

import lxml.etree
import pytest
from django.core import mail
from django.core.mail.message import EmailMultiAlternatives
from django.test import override_settings
from django.urls import reverse
from djoser.conf import settings
from faker import Faker
from lxml.html import fragment_fromstring
from rest_framework.test import APIClient

from authentication.factories import CustomUserFactory
from authentication.models import CustomUser

faker = Faker()


class AnchorData:
    element: lxml.etree._Element
    parsed: ParseResult
    query: dict[str, list[str]]
    raw: str

    def __init__(self, element):
        self.element = element
        self.parsed = urlparse(element.attrib["href"])
        self.query = parse_qs(self.parsed.query)
        self.raw = element.attrib["href"]


def get_parsed_url_from_html(
    message: EmailMultiAlternatives, data_testid
) -> AnchorData:
    html = next(
        content for content, mime in message.alternatives if mime == "text/html"
    )

    if not isinstance(html, str):
        msg = "Expected html to be a string"
        raise TypeError(msg)
    doc = fragment_fromstring(f"<div>{html}</div>")
    [link] = doc.cssselect(f'[data-testid="{data_testid}"]')
    return AnchorData(link)


@pytest.mark.django_db
def test_create_and_activate_user():
    client = APIClient()
    email = faker.email()
    password = faker.password()
    creation_url = reverse("customuser-list")
    creation_request = {
        "email": email,
        "password": password,
        "re_password": password,
        "public_nickname": faker.name(),
    }
    response = client.post(creation_url, creation_request)

    user_id = response.data["id"]

    assert response.status_code == 201

    message = mail.outbox[0]
    link = get_parsed_url_from_html(message, "activation-link")

    # HTML has the url we expected
    assert link.raw == settings._CUSTOM["ACTIVATION_URL"].format(
        uid=link.query["uid"][0], token=link.query["token"][0]
    )
    # Raw text email has same url
    assert str(link.raw) in message.body

    # Initially NOT active
    created_user = CustomUser.objects.get(id=user_id)
    assert created_user.is_active is False

    # Activate user
    activation_url = reverse("customuser-activation")
    activation_request = {
        "uid": link.query["uid"][0],
        "token": link.query["token"][0],
    }
    activation_response = client.post(activation_url, activation_request)
    assert activation_response.status_code == 204

    # Now active
    activated_user = CustomUser.objects.get(id=user_id)
    assert activated_user.is_active is True


@pytest.mark.django_db
def test_resend_activation():
    client = APIClient()
    user = CustomUserFactory()

    assert user.is_active is False
    resend_url = reverse("customuser-resend-activation")
    resent_request = {
        "email": user.email,
    }
    resend_response = client.post(resend_url, resent_request)
    message = mail.outbox[0]
    link = get_parsed_url_from_html(message, "activation-link")
    assert resend_response.status_code == 204

    # Activate user
    activation_url = reverse("customuser-activation")
    activation_request = {
        "uid": link.query["uid"][0],
        "token": link.query["token"][0],
    }
    activation_response = client.post(activation_url, activation_request)
    assert activation_response.status_code == 204

    # Now active
    activated_user = CustomUser.objects.get(id=user.id)
    assert activated_user.is_active is True


@pytest.mark.django_db
def test_reset_password_active_user():
    client = APIClient()
    user = CustomUserFactory.create(is_active=True)
    url = reverse("customuser-reset-password")
    request = {
        "email": user.email,
    }
    response = client.post(url, request)
    message = mail.outbox[0]

    link = get_parsed_url_from_html(message, "password-reset-link")
    assert response.status_code == 204

    # HTML has the url we expected
    assert link.raw == settings._CUSTOM["PASSWORD_RESET_CONFIRM_URL"].format(
        uid=link.query["uid"][0], token=link.query["token"][0]
    )

    new_password = faker.password()
    assert user.check_password(new_password) is False

    confirmation_url = reverse("customuser-reset-password-confirm")
    confirmation_request = {
        "uid": link.query["uid"][0],
        "token": link.query["token"][0],
        "new_password": new_password,
        "re_new_password": new_password,
    }
    confirmation_response = client.post(confirmation_url, confirmation_request)
    assert confirmation_response.status_code == 204

    user.refresh_from_db()
    assert user.check_password(new_password)


@pytest.mark.django_db
def test_reset_password_inactive_user():
    client = APIClient()
    user = CustomUserFactory.create(is_active=False)
    url = reverse("customuser-reset-password")
    request = {
        "email": user.email,
    }
    response = client.post(url, request)
    message = mail.outbox[0]

    link = get_parsed_url_from_html(message, "activation-link")
    assert response.status_code == 204

    # HTML has the url we expected
    assert link.raw == settings._CUSTOM["ACTIVATION_URL"].format(
        uid=link.query["uid"][0], token=link.query["token"][0]
    )

    new_password = faker.password()
    assert user.check_password(new_password) is False

    # Activate user
    activation_url = reverse("customuser-activation")
    activation_request = {
        "uid": link.query["uid"][0],
        "token": link.query["token"][0],
    }
    activation_response = client.post(activation_url, activation_request)
    assert activation_response.status_code == 204

    # Now active
    activated_user = CustomUser.objects.get(id=user.id)
    assert activated_user.is_active is True


@pytest.mark.django_db
def test_can_retrieve_own_user():
    client = APIClient()
    user = CustomUserFactory.create(is_active=True)
    url = reverse("customuser-me")
    client.force_authenticate(user)
    response = client.get(url)
    assert response.status_code == 200
    assert response.data == {
        "id": user.id,
        "email": user.email,
        "public_nickname": user.public_nickname,
    }


@pytest.mark.django_db
def test_cannot_change_email_via_users_me():
    client = APIClient()
    user = CustomUserFactory.create(is_active=True)
    url = reverse("customuser-me")
    client.force_authenticate(user)
    request = {"public_nickname": "new-nickname", "email": "new-email@foo.com"}
    response = client.patch(url, request)
    assert response.status_code == 200
    assert response.data == {
        "id": user.id,
        "email": user.email,
        "public_nickname": "new-nickname",
    }


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_blocks_user_creation():
    client = APIClient()
    creation_url = reverse("customuser-list")
    creation_request = {
        "email": faker.email(),
        "password": faker.password(),
        "re_password": faker.password(),
        "public_nickname": faker.name(),
    }
    response = client.post(creation_url, creation_request)
    assert response.status_code == 403
    assert response.data["detail"] == "User registration is currently disabled."


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_login_still_works():
    client = APIClient()
    user = CustomUserFactory.create(is_active=True)
    login_url = reverse("login")
    response = client.post(login_url, {"email": user.email, "password": "testpassword"})
    assert response.status_code == 200
    assert "auth_token" in response.data


@pytest.mark.django_db
@pytest.mark.parametrize("is_staff", [False, True])
def test_admin_activation_api(is_staff):
    client = APIClient()
    user_targeted = CustomUserFactory.create(is_active=False)
    user_requesting = CustomUserFactory.create(is_staff=is_staff)
    url = reverse("customuser-activate-other", kwargs={"id": user_targeted.id})
    client.force_authenticate(user_requesting)
    response = client.post(url)

    if is_staff:
        assert response.status_code == 204
        user_targeted.refresh_from_db()
        assert user_targeted.is_active is True
    else:
        assert response.status_code == 403
        user_targeted.refresh_from_db()
        assert user_targeted.is_active is False
