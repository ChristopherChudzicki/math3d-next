import re
from urllib.parse import ParseResult, parse_qs, urlparse

import lxml.etree
import pytest
from django.core import mail
from django.core.mail.message import EmailMessage
from django.urls import reverse
from djoser.conf import settings
from faker import Faker
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


def get_parsed_activation_url_from_html(
    message: EmailMessage, data_testid
) -> AnchorData:
    html, _ = next(alt for alt in message.alternatives if alt[1] == "text/html")
    doc = lxml.etree.fromstring(html, parser=lxml.etree.HTMLParser())
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
    }
    creation_request = response = client.post(creation_url, creation_request)

    user_id = response.data["id"]

    assert response.status_code == 201

    message = mail.outbox[0]
    link = get_parsed_activation_url_from_html(message, "activation-link")

    # HTML has the url we expected
    assert link.raw == settings._CUSTOM["ACTIVATION_URL"].format(
        uid=link.query["uid"][0], token=link.query["token"][0]
    )
    # Raw text email has same url
    assert str(link.raw) in message.body

    # Initially NOT active
    created_user = CustomUser.objects.get(id=user_id)
    assert created_user.is_active == False

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
    assert activated_user.is_active == True


@pytest.mark.django_db
def test_resend_activation():
    client = APIClient()
    user = CustomUserFactory()

    assert user.is_active == False
    resend_url = reverse("customuser-resend-activation")
    resent_request = {
        "email": user.email,
    }
    resend_response = client.post(resend_url, resent_request)
    message = mail.outbox[0]
    link = get_parsed_activation_url_from_html(message, "activation-link")
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
    assert activated_user.is_active == True


@pytest.mark.django_db
def test_reset_password():
    client = APIClient()
    user = CustomUserFactory.create(is_active=True)
    url = reverse("customuser-reset-password")
    request = {
        "email": user.email,
    }
    response = client.post(url, request)
    message = mail.outbox[0]
    link = get_parsed_activation_url_from_html(message, "password-reset-link")
    assert response.status_code == 204

    new_password = faker.password()
    assert user.check_password(new_password) == False

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


# This should be limited to admin users
@pytest.mark.django_db
@pytest.mark.parametrize("is_staff", [True, False])
def test_cannot_change_email_via_set_username(is_staff):
    client = APIClient()
    user = CustomUserFactory.create(is_active=True, is_staff=is_staff)
    url = reverse("customuser-set-username")
    client.force_authenticate(user)
    request = {
        "new_email": "new-email@foo.com",
        "current_password": "testpassword",
    }
    response = client.post(url, request)
    assert response.status_code == 204 if is_staff else 403
