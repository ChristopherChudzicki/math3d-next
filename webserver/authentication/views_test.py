from urllib.parse import ParseResult, parse_qs, urlparse

import lxml.etree
import pytest
from allauth.account.models import EmailAddress
from django.core import mail
from django.core.mail.message import EmailMultiAlternatives
from django.test import Client, override_settings
from faker import Faker
from lxml.html import fragment_fromstring

from authentication.factories import CustomUserFactory
from authentication.models import CustomUser

faker = Faker()

# allauth headless endpoints
SIGNUP_URL = "/_allauth/browser/v1/auth/signup"
LOGIN_URL = "/_allauth/browser/v1/auth/login"
SESSION_URL = "/_allauth/browser/v1/auth/session"
EMAIL_VERIFY_URL = "/_allauth/browser/v1/auth/email/verify"
PASSWORD_REQUEST_URL = "/_allauth/browser/v1/auth/password/request"
PASSWORD_RESET_URL = "/_allauth/browser/v1/auth/password/reset"

# Custom DRF endpoints
USER_ME_URL = "/v0/auth/users/me/"


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
# allauth headless: Registration + Email Verification
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

    # Verify email
    client.post(
        EMAIL_VERIFY_URL,
        {"key": key},
        content_type="application/json",
    )
    # allauth verifies the email but returns 401 (not authenticated yet)
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

    message = mail.outbox[0]
    link = get_parsed_url_from_html(message, "activation-link")

    # URL contains key parameter
    assert "key" in link.query
    # URL is in both HTML and plain text
    assert link.raw in message.body


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_login_blocked_until_email_verified():
    """Login is blocked for unverified users; login works after verification."""
    client = _make_client()
    email = faker.email()
    password = _strong_password()

    # Sign up
    client.post(
        SIGNUP_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert len(mail.outbox) == 1

    # Attempt login — blocked because email not verified
    login_resp = client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert login_resp.status_code == 401

    # Verify using key from signup email
    key = _extract_email_verification_key(mail.outbox[0])
    client.post(
        EMAIL_VERIFY_URL,
        {"key": key},
        content_type="application/json",
    )
    email_addr = EmailAddress.objects.get(email=email)
    assert email_addr.verified is True

    # Now login succeeds
    login_resp2 = client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        content_type="application/json",
    )
    assert login_resp2.status_code == 200


# --------------------------------------------------------------------------
# allauth headless: Login / Logout
# --------------------------------------------------------------------------


@pytest.mark.django_db
def test_login_and_logout():
    """Login via allauth, check session, then logout."""
    client = _make_client()
    user = _create_verified_user()

    # Login
    login_resp = client.post(
        LOGIN_URL,
        {"email": user.email, "password": "testpassword"},  # pragma: allowlist secret
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
# allauth headless: Password Reset
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
    assert reset_resp.status_code in (200, 401)

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
# Registration gating
# --------------------------------------------------------------------------


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_blocks_signup():
    """When ENABLE_REGISTRATION=False, signup returns an error."""
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


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_login_still_works():
    """Login works even when registration is disabled."""
    client = _make_client()
    user = _create_verified_user()

    login_resp = client.post(
        LOGIN_URL,
        {"email": user.email, "password": "testpassword"},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert login_resp.status_code == 200


# --------------------------------------------------------------------------
# Custom DRF endpoints: User profile (GET / PATCH)
# --------------------------------------------------------------------------


@pytest.mark.django_db
def test_get_user_profile():
    """GET /v0/auth/users/me/ returns current user data."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.get(USER_ME_URL)
    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "email": user.email,
        "public_nickname": user.public_nickname,
    }


@pytest.mark.django_db
def test_patch_user_profile():
    """PATCH /v0/auth/users/me/ updates public_nickname."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.patch(
        USER_ME_URL,
        {"public_nickname": "new-nickname"},
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "email": user.email,
        "public_nickname": "new-nickname",
    }


@pytest.mark.django_db
def test_cannot_change_email_via_users_me():
    """Email is read-only on PATCH /v0/auth/users/me/."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.patch(
        USER_ME_URL,
        {"public_nickname": "new-nickname", "email": "new-email@foo.com"},
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["email"] == user.email
    assert response.json()["public_nickname"] == "new-nickname"


@pytest.mark.django_db
def test_user_me_requires_authentication():
    """GET /v0/auth/users/me/ returns 403 for unauthenticated requests."""
    client = _make_client()
    response = client.get(USER_ME_URL)
    assert response.status_code == 403


# --------------------------------------------------------------------------
# Custom DRF endpoint: Delete account
# --------------------------------------------------------------------------


@pytest.mark.django_db
def test_delete_account():
    """DELETE /v0/auth/users/me/ deletes the user with correct password."""
    client = _make_client()
    user = _create_verified_user()
    user_id = user.id
    client.force_login(user)

    response = client.delete(
        USER_ME_URL,
        {"current_password": "testpassword"},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert response.status_code == 204
    assert not CustomUser.objects.filter(id=user_id).exists()


@pytest.mark.django_db
def test_delete_account_wrong_password():
    """DELETE /v0/auth/users/me/ fails with wrong password."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.delete(
        USER_ME_URL,
        {"current_password": "wrongpassword"},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_delete_account_missing_password():
    """DELETE /v0/auth/users/me/ fails without password."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.delete(
        USER_ME_URL,
        {},
        content_type="application/json",
    )
    assert response.status_code == 400


# --------------------------------------------------------------------------
# Custom DRF endpoint: Admin Activate
# --------------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize("is_staff", [False, True])
def test_admin_activation(is_staff):
    """Admin activate endpoint sets is_active and creates verified EmailAddress."""
    client = _make_client()
    target_user = CustomUserFactory.create(is_active=False)
    admin_user = CustomUserFactory.create(is_staff=is_staff)
    client.force_login(admin_user)

    url = f"/v0/auth/users/{target_user.id}/activation/"
    response = client.post(url)

    if is_staff:
        assert response.status_code == 204
        target_user.refresh_from_db()
        assert target_user.is_active is True

        # Email is marked as verified in allauth
        email_address = EmailAddress.objects.get(
            user=target_user, email=target_user.email
        )
        assert email_address.verified is True
        assert email_address.primary is True
    else:
        assert response.status_code == 403
        target_user.refresh_from_db()
        assert target_user.is_active is False


@pytest.mark.django_db
def test_admin_activation_updates_existing_email_address():
    """Admin activate updates an existing unverified EmailAddress to verified."""
    client = _make_client()
    target_user = CustomUserFactory.create(is_active=False)
    # Pre-create an unverified EmailAddress (as would exist from signup)
    EmailAddress.objects.create(
        user=target_user, email=target_user.email, verified=False, primary=True
    )

    admin_user = CustomUserFactory.create(is_staff=True)
    client.force_login(admin_user)

    url = f"/v0/auth/users/{target_user.id}/activation/"
    response = client.post(url)
    assert response.status_code == 204

    email_address = EmailAddress.objects.get(user=target_user, email=target_user.email)
    assert email_address.verified is True
