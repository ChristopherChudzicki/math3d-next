import pytest
from allauth.account.models import EmailAddress
from django.test import Client, override_settings

from authentication.factories import FACTORY_PASSWORD, CustomUserFactory
from authentication.models import CustomUser

ME_URL = "/v1/auth/users/me/"
DELETE_URL = "/v1/auth/users/me/delete/"
ACTIVATION_URL = "/v1/auth/users/activation/"
SIGNUP_URL = "/_allauth/browser/v1/auth/signup"


@pytest.mark.django_db
def test_me_get_requires_auth():
    assert Client().get(ME_URL).status_code == 403


@pytest.mark.django_db
def test_me_get_anonymous_seeds_csrf_cookie():
    # The SPA's bootstrap GET runs while anonymous (on the login/signup/reset
    # pages) and relies on this response to obtain a CSRF token for the ensuing
    # allauth POST. Seeding must happen before the auth gate — regression guard
    # for the cookie being skipped on the rejected anonymous request.
    response = Client().get(ME_URL)
    assert response.status_code == 403
    assert "csrftoken" in response.cookies


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
def test_me_patch_enforces_csrf():
    # v0 parity (test_csrf_token_required_for_unsafe_requests): Ninja's SessionAuth
    # must reject an unsafe request lacking the CSRF token. The other patch tests
    # use force_login, which bypasses CSRF *enforcement*, so this uses
    # enforce_csrf_checks=True to actually exercise the check.
    client = Client(enforce_csrf_checks=True)
    user = CustomUserFactory.create()
    client.force_login(user)

    # GET seeds the csrftoken cookie (get_me calls get_token()).
    get_resp = client.get(ME_URL)
    assert get_resp.status_code == 200
    assert "csrftoken" in get_resp.cookies

    # PATCH without the X-CSRFToken header is rejected.
    no_token = client.patch(
        ME_URL,
        data={"public_nickname": "newnick"},
        content_type="application/json",
    )
    assert no_token.status_code == 403

    # PATCH with the token from the cookie succeeds.
    token = client.cookies["csrftoken"].value
    with_token = client.patch(
        ME_URL,
        data={"public_nickname": "newnick"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert with_token.status_code == 200


@pytest.mark.django_db
def test_me_patch_requires_auth():
    # patch_me is auth=session_auth; an anonymous PATCH is rejected before the body
    # is processed. (Only the GET seeds-csrf path is intentionally auth=None.)
    response = Client().patch(
        ME_URL,
        data={"public_nickname": "newnick"},
        content_type="application/json",
    )
    assert response.status_code == 403


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
def test_delete_requires_auth():
    # delete_me is auth=session_auth; an anonymous POST is rejected.
    response = Client().post(
        DELETE_URL,
        data={"current_password": FACTORY_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_flushes_session():
    # delete_me calls request.session.flush(); without it the session would retain
    # _auth_user_id pointing at the now-deleted user. Asserting the key is gone
    # distinguishes the flush from the user-row deletion alone.
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)
    response = client.post(
        DELETE_URL,
        data={"current_password": FACTORY_PASSWORD},
        content_type="application/json",
    )
    assert response.status_code == 204
    assert "_auth_user_id" not in client.session


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


@pytest.mark.django_db
def test_activation_activates_user_and_creates_verified_email():
    target = CustomUserFactory.create(is_active=False)
    admin = CustomUserFactory.create(is_staff=True)
    client = Client()
    client.force_login(admin)
    response = client.post(
        ACTIVATION_URL,
        data={"email": target.email},
        content_type="application/json",
    )
    assert response.status_code == 204
    target.refresh_from_db()
    assert target.is_active is True
    email_address = EmailAddress.objects.get(user=target, email=target.email)
    assert email_address.verified is True
    assert email_address.primary is True


@pytest.mark.django_db
def test_activation_updates_existing_unverified_email_address():
    # update_or_create path: a signup leaves an unverified EmailAddress; activation
    # must flip it to verified rather than error on the duplicate.
    target = CustomUserFactory.create(is_active=False)
    EmailAddress.objects.create(
        user=target, email=target.email, verified=False, primary=True
    )
    admin = CustomUserFactory.create(is_staff=True)
    client = Client()
    client.force_login(admin)
    response = client.post(
        ACTIVATION_URL,
        data={"email": target.email},
        content_type="application/json",
    )
    assert response.status_code == 204
    email_address = EmailAddress.objects.get(user=target, email=target.email)
    assert email_address.verified is True


@pytest.mark.django_db
def test_activation_already_active_user_is_idempotent():
    # Re-activating an active user with an already-verified email is a no-op 204,
    # not an error (update_or_create tolerates the existing verified row).
    target = CustomUserFactory.create(is_active=True)
    EmailAddress.objects.create(
        user=target, email=target.email, verified=True, primary=True
    )
    admin = CustomUserFactory.create(is_staff=True)
    client = Client()
    client.force_login(admin)
    response = client.post(
        ACTIVATION_URL,
        data={"email": target.email},
        content_type="application/json",
    )
    assert response.status_code == 204
    target.refresh_from_db()
    assert target.is_active is True
    assert EmailAddress.objects.get(user=target, email=target.email).verified is True


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_registration_disabled_blocks_signup():
    # Guards CustomAccountAdapter.is_open_for_signup (authentication/adapter.py) —
    # our override of allauth's signup gate. Hits the allauth headless signup
    # endpoint (not a v1 route); kept here because e2e always runs with
    # registration enabled and so cannot exercise the disabled branch.
    response = Client().post(
        SIGNUP_URL,
        data={
            "email": "newuser@example.com",
            "password": "h7$Wq2!zPk9mLx4r",  # pragma: allowlist secret
        },
        content_type="application/json",
    )
    assert response.status_code == 403
