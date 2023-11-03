import re

import lxml.etree
import pytest
from django.core import mail
from django.core.mail.message import EmailMessage
from django.urls import reverse
from djoser.conf import settings
from rest_framework.test import APIClient
from urllib.parse import urlparse, parse_qs, ParseResult
from authentication.models import CustomUser
from faker import Faker
from authentication.factories import CustomUserFactory

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


def get_parsed_activation_url_from_html(message: EmailMessage, data_testid) -> AnchorData:
    html, _ = next(alt for alt in message.alternatives if alt[1] == "text/html")
    doc = lxml.etree.fromstring(html, parser=lxml.etree.HTMLParser())
    [link] = doc.cssselect(f'[data-testid="{data_testid}"]')
    href = link.attrib["href"]
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
    print(link)
