"""Integration tests for provider (social) authentication via allauth headless.

The `dummy` provider stands in for Google on the exact path the SPA will use —
POST /_allauth/browser/v1/auth/provider/token — so the login flow is exercised
without contacting Google. Google itself cannot run locally: it refuses to
register a non-HTTPS, non-localhost origin (ADR-0004).
"""

import json

import pytest
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount
from django.test import Client, override_settings

from authentication.factories import CustomUserFactory
from authentication.models import CustomUser

TOKEN_URL = "/_allauth/browser/v1/auth/provider/token"
SESSION_URL = "/_allauth/browser/v1/auth/session"


def _payload(uid: int, email: str) -> dict:
    """The dummy provider's `id_token` is a plain JSON blob, not a JWT.

    It is fed straight to its AuthenticateForm, whose only required field is the
    integer `id` (allauth/socialaccount/providers/dummy/forms.py). No `client_id`
    is needed because DummyProvider sets `uses_apps = False`.
    """
    return {
        "provider": "dummy",
        "process": "login",
        "token": {
            "id_token": json.dumps({"id": uid, "email": email, "email_verified": True})
        },
    }


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_provider_token_signs_up_and_logs_in_in_one_request():
    """
    A first-time provider identity gets an account and a session in a single
    request, with ACCOUNT_EMAIL_VERIFICATION still "mandatory": the provider
    vouches for the address, so EmailVerificationStage never interrupts. This is
    what lets PRs 1-3 ship without flipping any allauth setting.
    """
    client = Client()

    response = client.post(
        TOKEN_URL,
        _payload(1234, "newcomer@example.com"),
        content_type="application/json",
    )

    assert response.status_code == 200
    user = CustomUser.objects.get(email="newcomer@example.com")
    assert SocialAccount.objects.get(user=user).uid == "1234"
    assert EmailAddress.objects.get(user=user).verified is True
    assert client.session["_auth_user_id"] == str(user.pk)


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=False)
def test_provider_token_rejects_an_unseen_identity_when_signup_is_closed():
    """Closing registration must actually close it: ProviderTokenView turns
    SignupClosedException into a 403."""
    response = Client().post(
        TOKEN_URL,
        _payload(555, "stranger@example.com"),
        content_type="application/json",
    )

    assert response.status_code == 403
    assert not CustomUser.objects.filter(email="stranger@example.com").exists()


@pytest.mark.django_db
def test_provider_token_still_logs_in_a_known_identity_when_signup_is_closed():
    """
    Closing registration strands nobody: the signup gate is reached only on the
    new-identity branch. ENABLE_REGISTRATION is planned to be turned back off
    after release, and this is the promise that makes that safe.
    """
    client = Client()
    with override_settings(ENABLE_REGISTRATION=True):
        first = client.post(
            TOKEN_URL,
            _payload(4242, "returning@example.com"),
            content_type="application/json",
        )
    assert first.status_code == 200
    client.logout()

    with override_settings(ENABLE_REGISTRATION=False):
        second = client.post(
            TOKEN_URL,
            _payload(4242, "returning@example.com"),
            content_type="application/json",
        )

    assert second.status_code == 200
    assert CustomUser.objects.filter(email="returning@example.com").count() == 1


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_provider_identity_is_never_adopted_onto_an_existing_account():
    """
    Anyone who controls an email address must not be able to take over the
    account already using it. Linking is pinned off in settings; this pins the
    behaviour, which allauth resolves from three sources (the global setting, a
    per-provider key, and a SocialApp row) that a settings assertion cannot all
    reach. The login stops short of a session rather than adopting the account.
    """
    existing = CustomUserFactory.create(email="collide@example.com")
    client = Client()

    response = client.post(
        TOKEN_URL,
        _payload(777, existing.email),
        content_type="application/json",
    )

    assert response.status_code == 401  # not signed in
    assert "_auth_user_id" not in client.session
    assert not SocialAccount.objects.filter(user=existing).exists()
    assert CustomUser.objects.filter(email=existing.email).count() == 1


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_session_delete_signs_out_a_provider_user():
    """The SPA's only sign-out call. Under SOCIALACCOUNT_ONLY the response is a
    401 carrying the anonymous session state, which `useLogout` treats as
    success (allauth/headless/base/response.py)."""
    client = Client()
    client.post(
        TOKEN_URL,
        _payload(uid=4242, email="signs-out@example.com"),
        content_type="application/json",
    )
    assert client.session["_auth_user_id"]

    response = client.delete(SESSION_URL)

    assert response.status_code == 401
    assert "_auth_user_id" not in client.session
