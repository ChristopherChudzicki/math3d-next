"""Integration tests for provider (social) authentication via allauth headless.

The adapter's rules are driven through `dummy` on `provider/token`, which reaches
the same `pre_social_login` / `save_user` hooks as a Google redirect sign-in
without contacting anyone. Google's own path — the callback, state, PKCE and
the code exchange — is tested separately below with its token endpoint stubbed.
"""

import base64
import hashlib
import json
import logging
import time
from unittest import mock
from urllib.parse import parse_qs, urlparse

import jwt
import pytest
from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import get_adapter as get_socialaccount_adapter
from allauth.socialaccount.models import SocialAccount, SocialApp
from allauth.socialaccount.providers.google.views import ID_TOKEN_ISSUER
from allauth.socialaccount.providers.oauth2.client import OAuth2Client, OAuth2Error
from django.conf import settings
from django.contrib import admin
from django.core.exceptions import ImproperlyConfigured
from django.test import Client, override_settings

from authentication.factories import CustomUserFactory
from authentication.models import CustomUser

TOKEN_URL = "/_allauth/browser/v1/auth/provider/token"
SIGNUP_URL = "/_allauth/browser/v1/auth/provider/signup"
SESSION_URL = "/_allauth/browser/v1/auth/session"


def _payload(
    uid: int,
    email: str | None,
    *,
    email_verified: bool = True,
    process: str = "login",
) -> dict:
    """The dummy provider's `id_token` is a plain JSON blob, not a JWT.

    It is fed straight to its AuthenticateForm, whose only required field is the
    integer `id` (allauth/socialaccount/providers/dummy/forms.py). No `client_id`
    is needed because DummyProvider sets `uses_apps = False`.
    """
    claims: dict = {"id": uid}
    if email is not None:
        claims |= {"email": email, "email_verified": email_verified}
    return {
        "provider": "dummy",
        "process": process,
        "token": {"id_token": json.dumps(claims)},
    }


def _codes(response) -> list[str]:
    return [error["code"] for error in response.json()["errors"]]


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_provider_token_signs_up_and_logs_in_in_one_request():
    """
    A first-time provider identity gets an account and a session in a single
    request: ACCOUNT_EMAIL_VERIFICATION is "none", so no verification stage
    ever interrupts, and EmailAddress.verified instead reflects the
    provider's own `email_verified` assertion.
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
    account already using it. Linking is pinned off in settings; this drives
    the collision down the real login path, where the request stops short of a
    session rather than adopting the account.
    """
    existing = CustomUserFactory.create(email="collide@example.com")
    client = Client()

    response = client.post(
        TOKEN_URL,
        _payload(777, existing.email),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert _codes(response) == ["email_taken"]
    assert "_auth_user_id" not in client.session
    assert not SocialAccount.objects.filter(user=existing).exists()
    assert CustomUser.objects.filter(email=existing.email).count() == 1


@pytest.mark.django_db
def test_a_social_app_row_cannot_shadow_the_configured_google_app():
    """A SocialApp row for google would otherwise blend into the app configured
    in settings and make get_app raise MultipleObjectsReturned — a 500 on every
    sign-in, from a row any staff user can add through the admin."""
    configured = settings.SOCIALACCOUNT_PROVIDERS["google"]["APP"]["client_id"]
    SocialApp.objects.create(
        provider="google", name="Added in the admin", client_id=configured, secret=""
    )

    app = get_socialaccount_adapter().get_app(None, "google")

    assert app.pk is None
    assert app.client_id == configured


def test_the_social_app_form_is_not_offered_in_the_admin():
    """Rows added there do nothing, so offering the form only misleads."""
    assert not admin.site.is_registered(SocialApp)


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


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_provider_signup_cannot_resume_a_refused_collision():
    """
    The collision is refused before a pending login is stashed, so allauth's
    provider signup form — mounted unconditionally under SOCIALACCOUNT_ONLY, and
    happy to take any unused address without comparing it to the provider's —
    has nothing to complete. Without that, the address on the resulting account
    is one no provider ever asserted.
    """
    existing = CustomUserFactory.create(email="collide@example.com")
    # Every account a provider created has this row, and it is what makes
    # cleanup_email_addresses drop the provider's address and keep the
    # form's — the difference between squatting an address and an
    # IntegrityError on CustomUser.email.
    EmailAddress.objects.create(
        user=existing, email=existing.email, verified=True, primary=True
    )
    client = Client()
    refused = client.post(
        TOKEN_URL, _payload(777, existing.email), content_type="application/json"
    )
    assert refused.status_code == 400

    response = client.post(
        SIGNUP_URL,
        {"email": "unclaimed@example.com"},
        content_type="application/json",
    )

    assert response.status_code == 409
    assert not CustomUser.objects.filter(email="unclaimed@example.com").exists()
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_an_unverified_provider_address_is_refused():
    """The provider's `email_verified` claim is the entire basis for running
    without verification of our own, so a token that withholds it must not mint
    an account."""
    response = Client().post(
        TOKEN_URL,
        _payload(888, "unconfirmed@example.com", email_verified=False),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert _codes(response) == ["unverified_email"]
    assert not CustomUser.objects.filter(email="unconfirmed@example.com").exists()


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_a_provider_that_sends_no_address_is_refused():
    """A provider may legitimately return no email at all, which allauth also
    answers with the signup form."""
    response = Client().post(
        TOKEN_URL, _payload(999, None), content_type="application/json"
    )

    assert response.status_code == 400
    assert _codes(response) == ["unverified_email"]
    assert not CustomUser.objects.exists()


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True)
def test_linking_a_second_identity_is_not_mistaken_for_a_collision():
    """
    `process=connect` reaches the same hook with an address that is already
    taken — by the very account doing the linking — so the guard has to stand
    aside. Nothing sends `connect` yet; this pins the behaviour the linking flow
    in ADR-0004 depends on.
    """
    client = Client()
    client.post(
        TOKEN_URL, _payload(1111, "links@example.com"), content_type="application/json"
    )

    response = client.post(
        TOKEN_URL,
        _payload(2222, "links@example.com", process="connect"),
        content_type="application/json",
    )

    assert response.status_code == 200
    user = CustomUser.objects.get(email="links@example.com")
    assert SocialAccount.objects.filter(user=user).count() == 2
    assert CustomUser.objects.count() == 1


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True, SOCIALACCOUNT_AUTO_SIGNUP=False)
def test_the_signup_form_can_never_supply_the_address():
    """
    The invariant must not rest on SOCIALACCOUNT_AUTO_SIGNUP's default. Off, an
    address the provider asserted is no longer enough to create the account —
    allauth stashes every login and waits for the form instead, which takes any
    unused address. save_user refuses rather than let the form's value through.
    """
    client = Client()
    client.post(
        TOKEN_URL,
        _payload(333, "newcomer@example.com"),
        content_type="application/json",
    )

    with pytest.raises(ImproperlyConfigured):
        client.post(
            SIGNUP_URL,
            {"email": "unclaimed@example.com"},
            content_type="application/json",
        )

    assert not CustomUser.objects.exists()


# Google. `provider_class` closes provider/token to it; the redirect flow is
# the only way in.

CONFIGURED_CLIENT_ID = "test-client.apps.googleusercontent.com"
# The real Google settings with a known client, so PKCE and AUTH_PARAMS are
# the ones production runs with.
GOOGLE_PROVIDERS = {
    "google": {
        **settings.SOCIALACCOUNT_PROVIDERS["google"],
        "APP": {
            "client_id": CONFIGURED_CLIENT_ID,
            "secret": "test-secret",  # pragma: allowlist secret
        },
    }
}


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True, SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS)
def test_provider_token_refuses_google_before_reading_the_token():
    """Rests on allauth honoring `provider_class`; an upgrade that stopped would
    reopen provider/token to any Google ID token issued for our client."""
    response = Client().post(
        TOKEN_URL,
        {
            "provider": "google",
            "process": "login",
            "token": {"client_id": CONFIGURED_CLIENT_ID, "id_token": "not-read"},
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert _codes(response) == ["token_authentication_not_supported"]


# Google through the redirect flow. Only Google's token endpoint is stubbed:
# state, PKCE, the callback view and the ID-token checks all run for real.

REDIRECT_URL = "/_allauth/browser/v1/auth/provider/redirect"
GOOGLE_CALLBACK_URL = "/_allauth/google/login/callback/"
# Absolute, as the SPA sends it; allauth accepts it because the SPA's origin is
# CSRF-trusted. APP_BASE_URL is empty under test_settings, so it's set here.
SPA_ORIGIN = "https://app.example.org"
SPA_CALLBACK = f"{SPA_ORIGIN}/some-scene"
GOOGLE_REDIRECT_SETTINGS = override_settings(
    SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS, CSRF_TRUSTED_ORIGINS=[SPA_ORIGIN]
)


def _start_google_sign_in(client: Client) -> dict[str, str]:
    """POST the form the SPA submits; return Google's authorization query."""
    response = client.post(
        REDIRECT_URL,
        {"provider": "google", "process": "login", "callback_url": SPA_CALLBACK},
    )
    assert response.status_code == 302
    location = urlparse(response["Location"])
    assert location.netloc == "accounts.google.com"
    return {key: values[0] for key, values in parse_qs(location.query).items()}


def _google_token_response(*, sub: str, email: str) -> dict:
    # The ID token arrives over TLS from the token endpoint, so allauth skips
    # its signature; aud, iss and exp are still checked.
    now = int(time.time())
    id_token = jwt.encode(
        {
            "iss": ID_TOKEN_ISSUER,
            "aud": CONFIGURED_CLIENT_ID,
            "sub": sub,
            "email": email,
            "email_verified": True,
            "iat": now,
            "exp": now + 3600,
        },
        key="k" * 32,
        algorithm="HS256",
    )
    return {"access_token": "access", "expires_in": 3600, "id_token": id_token}


def _finish_google_sign_in(client: Client, authorize: dict[str, str], **exchange):
    with mock.patch.object(OAuth2Client, "get_access_token", **exchange) as stub:
        response = client.get(
            GOOGLE_CALLBACK_URL, {"code": "one-time-code", "state": authorize["state"]}
        )
    return response, stub


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
@override_settings(ENABLE_REGISTRATION=True)
def test_google_sign_in_round_trip_signs_up_and_returns_to_the_spa():
    client = Client()
    authorize = _start_google_sign_in(client)

    assert authorize["redirect_uri"] == f"http://testserver{GOOGLE_CALLBACK_URL}"
    assert "email" in authorize["scope"].split()
    assert authorize["prompt"] == "select_account"
    assert authorize["code_challenge_method"] == "S256"

    response, exchange = _finish_google_sign_in(
        client,
        authorize,
        return_value=_google_token_response(sub="104729", email="googler@example.com"),
    )

    assert response.status_code == 302
    assert response["Location"] == SPA_CALLBACK
    verifier = exchange.call_args.kwargs["pkce_code_verifier"]
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    assert challenge == authorize["code_challenge"]
    user = CustomUser.objects.get(email="googler@example.com")
    assert SocialAccount.objects.get(user=user, provider="google").uid == "104729"
    assert client.session["_auth_user_id"] == str(user.pk)


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
def test_a_denied_consent_returns_to_the_spa_with_cancelled():
    client = Client()
    authorize = _start_google_sign_in(client)

    response = client.get(
        GOOGLE_CALLBACK_URL, {"error": "access_denied", "state": authorize["state"]}
    )

    assert response.status_code == 302
    assert response["Location"] == f"{SPA_CALLBACK}?error=cancelled&error_process=login"


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
@override_settings(ENABLE_REGISTRATION=True)
def test_an_adapter_refusal_returns_its_code_to_the_spa():
    """The SPA maps these codes to text, so the redirect path must carry the
    adapter's own code, not a generic one."""
    CustomUserFactory.create(email="collide@example.com")
    client = Client()
    authorize = _start_google_sign_in(client)

    response, _ = _finish_google_sign_in(
        client,
        authorize,
        return_value=_google_token_response(sub="555", email="collide@example.com"),
    )

    assert (
        response["Location"] == f"{SPA_CALLBACK}?error=email_taken&error_process=login"
    )
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
@override_settings(ENABLE_REGISTRATION=False)
def test_closed_registration_returns_signup_closed_to_the_spa():
    """allauth raises this outside the adapter, on a path of its own."""
    client = Client()
    authorize = _start_google_sign_in(client)

    response, _ = _finish_google_sign_in(
        client,
        authorize,
        return_value=_google_token_response(sub="777", email="newcomer@example.com"),
    )

    assert (
        response["Location"]
        == f"{SPA_CALLBACK}?error=signup_closed&error_process=login"
    )


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
def test_a_failed_code_exchange_is_logged_with_its_cause(caplog, monkeypatch):
    """The SPA only sees `unknown`; a wrong client secret must be diagnosable
    from the server's error log (and so from Sentry)."""
    # LOGGING stops `authentication` at its own handler; caplog listens at root.
    monkeypatch.setattr(logging.getLogger("authentication"), "propagate", True)
    client = Client()
    authorize = _start_google_sign_in(client)

    with caplog.at_level(logging.ERROR, logger="authentication.adapter"):
        response, _ = _finish_google_sign_in(
            client, authorize, side_effect=OAuth2Error("invalid_client")
        )

    assert response["Location"] == f"{SPA_CALLBACK}?error=unknown&error_process=login"
    [record] = caplog.records
    assert record.exc_info is not None
    assert isinstance(record.exc_info[1], OAuth2Error)


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
def test_a_callback_with_unknown_state_lands_on_the_sign_in_error_page():
    """Without its state allauth can't know callback_url, so it falls back to
    socialaccount_login_error. A forged or replayed callback signs no one in."""
    client = Client()

    with mock.patch.object(OAuth2Client, "get_access_token") as exchange:
        response = client.get(
            GOOGLE_CALLBACK_URL, {"code": "one-time-code", "state": "forged"}
        )

    assert urlparse(response["Location"]).path == "/app/sign-in-error"
    exchange.assert_not_called()
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
@GOOGLE_REDIRECT_SETTINGS
def test_a_rejected_redirect_request_lands_on_the_sign_in_error_page():
    """provider/redirect refuses a callback_url off the trusted origins before
    any state exists, so allauth falls back to socialaccount_login_error."""
    response = Client().post(
        REDIRECT_URL,
        {
            "provider": "google",
            "process": "login",
            "callback_url": "https://elsewhere.example/scene",
        },
    )

    assert response.status_code == 302
    location = urlparse(response["Location"])
    assert location.path == "/app/sign-in-error"
    assert parse_qs(location.query)["error"] == ["unknown"]
