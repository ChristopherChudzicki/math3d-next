import re

import lxml.etree
import pytest
from django.core import mail
from django.urls import reverse
from djoser.conf import settings
from faker import Faker
from rest_framework.test import APIClient

faker = Faker()


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

    message = mail.outbox[0]

    assert message.subject == "Activate your account"
    partern = settings._CUSTOM["ACTIVATION_URL"].format(uid=".*", token=".*")
    assert re.search(partern, message.body)
    html, _ = next(alt for alt in message.alternatives if alt[1] == "text/html")
    doc = lxml.etree.fromstring(html)
    [link] = doc.cssselect("a")
    assert re.search(partern, link.attrib["href"])
