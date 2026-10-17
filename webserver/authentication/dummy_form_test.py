"""The dev sign-in page: allauth's dummy provider form, rendered by our template."""

from html.parser import HTMLParser

import pytest

from main.management.commands import seed_test_data

FORM_URL = "/_allauth/dummy/authenticate/?state=any"


class _Inputs(HTMLParser):
    """The sign-in form's visible inputs, by name."""

    def __init__(self):
        super().__init__()
        self.inputs: dict[str, dict] = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "input" and attrs.get("type") != "hidden":
            self.inputs[attrs["name"]] = attrs


def _inputs(response) -> dict[str, dict]:
    parser = _Inputs()
    parser.feed(response.content.decode())
    return parser.inputs


@pytest.fixture
def seeded(monkeypatch):
    monkeypatch.setattr(seed_test_data.env, "TEST_USER_STATIC_UID", "9000000001")
    monkeypatch.setattr(
        seed_test_data.env, "TEST_USER_STATIC_EMAIL", "seeded@example.com"
    )


@pytest.mark.django_db
def test_the_form_offers_the_seeded_user(client, seeded):
    inputs = _inputs(client.get(FORM_URL))

    assert inputs.keys() == {"id", "email", "email_verified"}
    assert inputs["id"]["value"] == "9000000001"
    assert inputs["email"]["value"] == "seeded@example.com"
    assert "checked" in inputs["email_verified"]


@pytest.mark.django_db
def test_a_rejected_submission_keeps_what_was_typed(client, seeded):
    response = client.post(
        FORM_URL, {"id": "not-a-number", "email": "typed@example.com"}
    )

    assert b"Enter a whole number." in response.content
    inputs = _inputs(response)
    assert inputs["id"]["value"] == "not-a-number"
    assert inputs["email"]["value"] == "typed@example.com"
    assert "checked" not in inputs["email_verified"]
