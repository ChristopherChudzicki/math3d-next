import pytest
from allauth.account.models import EmailAddress
from django.test import Client
from faker import Faker

from authentication.factories import FACTORY_PASSWORD, CustomUserFactory
from authentication.models import CustomUser

faker = Faker()

# Custom DRF endpoints
USER_ME_URL = "/v0/auth/users/me/"
DELETE_ACCOUNT_URL = "/v0/auth/users/me/delete/"


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
def test_csrf_token_required_for_unsafe_requests():
    """Session auth enforces CSRF: unsafe requests need a valid token."""
    # enforce_csrf_checks=True so DRF's SessionAuthentication CSRF check runs
    client = Client(enforce_csrf_checks=True)
    user = _create_verified_user()
    client.force_login(user)

    # A GET to UserMeView sets the csrftoken cookie via @ensure_csrf_cookie
    get_resp = client.get(USER_ME_URL)
    assert get_resp.status_code == 200
    assert "csrftoken" in get_resp.cookies

    # PATCH without the X-CSRFToken header is rejected
    no_token = client.patch(
        USER_ME_URL,
        {"public_nickname": "new-nickname"},
        content_type="application/json",
    )
    assert no_token.status_code == 403

    # PATCH with the token from the cookie succeeds
    token = client.cookies["csrftoken"].value
    with_token = client.patch(
        USER_ME_URL,
        {"public_nickname": "new-nickname"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert with_token.status_code == 200


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
    """POST /v0/auth/users/me/delete/ deletes the user with correct password."""
    client = _make_client()
    user = _create_verified_user()
    user_id = user.id
    client.force_login(user)

    response = client.post(
        DELETE_ACCOUNT_URL,
        {"current_password": FACTORY_PASSWORD},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert response.status_code == 204
    assert not CustomUser.objects.filter(id=user_id).exists()


@pytest.mark.django_db
def test_delete_account_wrong_password():
    """POST /v0/auth/users/me/delete/ fails with wrong password."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.post(
        DELETE_ACCOUNT_URL,
        {"current_password": "wrongpassword"},  # pragma: allowlist secret
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_delete_account_missing_password():
    """POST /v0/auth/users/me/delete/ fails without password."""
    client = _make_client()
    user = _create_verified_user()
    client.force_login(user)

    response = client.post(
        DELETE_ACCOUNT_URL,
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

    url = "/v0/auth/users/activation/"
    response = client.post(
        url, {"email": target_user.email}, content_type="application/json"
    )

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
def test_admin_activation_nonexistent_email_returns_404():
    """Activating an email with no matching user returns 404."""
    client = _make_client()
    admin_user = CustomUserFactory.create(is_staff=True)
    client.force_login(admin_user)

    url = "/v0/auth/users/activation/"
    response = client.post(
        url, {"email": faker.email()}, content_type="application/json"
    )
    assert response.status_code == 404


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

    url = "/v0/auth/users/activation/"
    response = client.post(
        url, {"email": target_user.email}, content_type="application/json"
    )
    assert response.status_code == 204

    email_address = EmailAddress.objects.get(user=target_user, email=target_user.email)
    assert email_address.verified is True
