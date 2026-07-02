"""Backend integration tests for the allauth headless endpoints (/_allauth/...).

These exercise the signup/verify, login/logout, and password-reset flows plus our
ENABLE_REGISTRATION gate. They are NOT v0/DRF tests — allauth headless is the auth
mechanism the current frontend uses and survives the v0 teardown — so they live
here rather than in views_test.py (which is deleted with v0). E2e covers the happy
paths; the registration-disabled branch is backend-only (e2e always runs with
registration enabled).
"""

from urllib.parse import ParseResult, parse_qs, urlparse

import lxml.etree
import pytest
from allauth.account.models import EmailAddress
from django.conf import settings
from django.core import mail
from django.core.mail.message import EmailMultiAlternatives
from django.test import Client, override_settings
from faker import Faker
from lxml.html import fragment_fromstring

from authentication.factories import FACTORY_PASSWORD, CustomUserFactory
from authentication.models import CustomUser

faker = Faker()

# allauth headless endpoints
SIGNUP_URL = "/_allauth/browser/v1/auth/signup"
LOGIN_URL = "/_allauth/browser/v1/auth/login"
SESSION_URL = "/_allauth/browser/v1/auth/session"
EMAIL_VERIFY_URL = "/_allauth/browser/v1/auth/email/verify"
PASSWORD_REQUEST_URL = "/_allauth/browser/v1/auth/password/request"
PASSWORD_RESET_URL = "/_allauth/browser/v1/auth/password/reset"


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


def _extract_email_verification_key(message: EmailMultiAlternatives) -> str:
    """Extract the verification key from the activation email."""
    link = get_parsed_url_from_html(message, "activation-link")
    return link.query["key"][0]


def _extract_password_reset_key(message: EmailMultiAlternatives) -> str:
    """Extract the password reset key from the password reset email."""
    link = get_parsed_url_from_html(message, "password-reset-link")
    return link.query["key"][0]


def _make_client() -> Client:
    """Create a Django test client with CSRF enforcement disabled."""
    return Client(enforce_csrf_checks=False)


def _create_verified_user(**kwargs) -> CustomUser:
    """Create a user with a verified email address (can log in via allauth)."""
    user = CustomUserFactory.create(is_active=True, **kwargs)
    EmailAddress.objects.create(
        user=user, email=user.email, verified=True, primary=True
    )
    return user


def _strong_password() -> str:
    """Generate a password that passes Django's validators."""
    return faker.password(length=16, special_chars=True, digits=True, upper_case=True)


# --------------------------------------------------------------------------
# Registration + Email Verification
# --------------------------------------------------------------------------


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_signup_and_verify_email():
    """Register via allauth, verify email, then log in."""
    client = _make_client()
    email = faker.email()
    password = _strong_password()
    nickname = faker.first_name()

    # Sign up
    response = client.post(
        SIGNUP_URL,
        {"email": email, "password": password, "public_nickname": nickname},
        content_type="application/json",
    )
    assert response.status_code == 401  # email verification required

    # User created and active, but email not verified
    user = CustomUser.objects.get(email=email)
    assert user.is_active is True
    assert user.public_nickname == nickname

    # Verification email sent
    assert len(mail.outbox) == 1
    key = _extract_email_verification_key(mail.outbox[0])

    # Cannot log in before verification
    login_resp = client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert login_resp.status_code == 401

    # Verify email — allauth verifies but returns 401 (user not logged in yet)
    verify_resp = client.post(
        EMAIL_VERIFY_URL,
        {"key": key},
        content_type="application/json",
    )
    assert verify_resp.status_code == 401
    email_addr = EmailAddress.objects.get(email=email)
    assert email_addr.verified is True

    # Now can log in
    login_resp2 = client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert login_resp2.status_code == 200


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_signup_sends_activation_email_with_correct_link():
    """Activation email contains the expected URL with key parameter."""
    client = _make_client()
    email = faker.email()
    password = _strong_password()

    client.post(
        SIGNUP_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )

    # public_nickname is optional and defaults to empty when omitted at signup
    user = CustomUser.objects.get(email=email)
    assert user.public_nickname == ""

    message = mail.outbox[0]
    link = get_parsed_url_from_html(message, "activation-link")

    # URL contains key parameter
    assert "key" in link.query
    # URL is in both HTML and plain text
    assert link.raw in message.body


# --------------------------------------------------------------------------
# Login / Logout
# --------------------------------------------------------------------------


@pytest.mark.django_db
def test_login_and_logout():
    """Login via allauth, check session, then logout."""
    client = _make_client()
    user = _create_verified_user()

    # Login
    login_resp = client.post(
        LOGIN_URL,
        {"email": user.email, "password": FACTORY_PASSWORD},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert login_resp.status_code == 200

    # Session is active
    session_resp = client.get(SESSION_URL)
    assert session_resp.status_code == 200

    # Logout — allauth returns 401 (unauthenticated) after successful logout
    logout_resp = client.delete(SESSION_URL)
    assert logout_resp.status_code == 401
    assert logout_resp.json()["meta"]["is_authenticated"] is False

    # Session is gone
    session_resp2 = client.get(SESSION_URL)
    assert session_resp2.status_code == 401


# --------------------------------------------------------------------------
# Password Reset
# --------------------------------------------------------------------------


@pytest.mark.django_db
def test_password_reset_flow():
    """Request password reset, use key to set new password."""
    client = _make_client()
    user = _create_verified_user()

    # Request reset
    resp = client.post(
        PASSWORD_REQUEST_URL,
        {"email": user.email},
        content_type="application/json",
    )
    assert resp.status_code == 200

    # Extract key from email
    assert len(mail.outbox) == 1
    key = _extract_password_reset_key(mail.outbox[0])

    # Reset password
    new_password = _strong_password()
    reset_resp = client.post(
        PASSWORD_RESET_URL,
        {"key": key, "password": new_password},
        content_type="application/json",
    )
    # allauth resets the password but returns 401 (user not logged in)
    assert reset_resp.status_code == 401

    # Can log in with new password
    login_resp = client.post(
        LOGIN_URL,
        {"email": user.email, "password": new_password},
        content_type="application/json",
    )
    assert login_resp.status_code == 200


@pytest.mark.django_db
def test_password_reset_email_has_correct_link():
    """Password reset email contains expected URL format."""
    client = _make_client()
    user = _create_verified_user()

    client.post(
        PASSWORD_REQUEST_URL,
        {"email": user.email},
        content_type="application/json",
    )

    message = mail.outbox[0]
    link = get_parsed_url_from_html(message, "password-reset-link")

    assert "key" in link.query
    assert link.raw in message.body


# --------------------------------------------------------------------------
# Email link origins
#
# One backend serves multiple trusted frontends locally (git worktrees on
# alternate ports), so email links target the requesting origin when it is
# CSRF-trusted, else the configured HEADLESS_FRONTEND_URLS origin. In
# production CSRF_TRUSTED_ORIGINS == [APP_BASE_URL] exactly (see
# settings_test.py), so the swap can never leave the canonical origin.
# --------------------------------------------------------------------------


@pytest.mark.django_db
@override_settings(CSRF_TRUSTED_ORIGINS=["http://math3d.localdev:3002"])
def test_email_links_use_requesting_origin_when_csrf_trusted():
    client = _make_client()
    user = _create_verified_user()

    client.post(
        PASSWORD_REQUEST_URL,
        {"email": user.email},
        content_type="application/json",
        HTTP_ORIGIN="http://math3d.localdev:3002",
    )

    link = get_parsed_url_from_html(mail.outbox[0], "password-reset-link")
    assert (
        f"{link.parsed.scheme}://{link.parsed.netloc}" == "http://math3d.localdev:3002"
    )


@pytest.mark.django_db
def test_email_links_fall_back_to_configured_origin_for_untrusted_origin():
    client = _make_client()
    user = _create_verified_user()

    client.post(
        PASSWORD_REQUEST_URL,
        {"email": user.email},
        content_type="application/json",
        HTTP_ORIGIN="https://evil.example",
    )

    configured = urlparse(
        settings.HEADLESS_FRONTEND_URLS["account_reset_password_from_key"]
    )
    link = get_parsed_url_from_html(mail.outbox[0], "password-reset-link")
    assert (link.parsed.scheme, link.parsed.netloc) == (
        configured.scheme,
        configured.netloc,
    )


# --------------------------------------------------------------------------
# Registration gating
# --------------------------------------------------------------------------


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_blocks_signup():
    """When ENABLE_REGISTRATION=False, signup returns an error.

    Guards CustomAccountAdapter.is_open_for_signup (authentication/adapter.py).
    Backend-only: e2e always runs with registration enabled.
    """
    client = _make_client()
    response = client.post(
        SIGNUP_URL,
        {
            "email": faker.email(),
            "password": _strong_password(),
            "public_nickname": faker.first_name(),
        },
        content_type="application/json",
    )
    assert response.status_code == 403
