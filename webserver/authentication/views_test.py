import re

import lxml.etree
import pytest
from django.core import mail
from django.core.mail.message import EmailMessage
from django.urls import reverse
from djoser.conf import settings
from faker import Faker
from rest_framework.test import APIClient
from urllib.parse import urlparse, parse_qs, ParseResult

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
def test_create_user():
    client = APIClient()
    url = reverse("customuser-list")
    email = faker.email()
    password = faker.password()
    request = {
        "email": email,
        "password": password,
        "re_password": password,
    }
    response = client.post(url, request)

    assert response.status_code == 201

    message = mail.outbox[0]
    link = get_parsed_activation_url_from_html(message, "activation-link")

    # HTML has the url we expected
    assert link.raw == settings._CUSTOM["ACTIVATION_URL"].format(
        uid=link.query["uid"][0], token=link.query["token"][0]
    )
    # Raw text email has same url
    assert str(link.raw) in message.body

    print(link.query)
