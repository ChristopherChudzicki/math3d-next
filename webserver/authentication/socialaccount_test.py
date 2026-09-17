"""Integration tests for provider (social) authentication via allauth headless.

The `dummy` provider stands in for Google on the exact path the SPA will use —
POST /_allauth/browser/v1/auth/provider/token — so the login flow is exercised
without contacting Google. Google itself cannot run locally: it refuses to
register a non-HTTPS, non-localhost origin (ADR-0004).

`dummy` sets `uses_apps = False`, though, so it never resolves a provider app.
The last section of this file drives the real Google provider with a locally
signed id_token to cover that.
"""

import datetime
import functools
import json
import time

import jwt
import pytest
from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import get_adapter as get_socialaccount_adapter
from allauth.socialaccount.models import SocialAccount, SocialApp
from allauth.socialaccount.providers.google.views import CERTS_URL, ID_TOKEN_ISSUER
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from django.conf import settings
from django.contrib import admin
from django.core.exceptions import ImproperlyConfigured
from django.test import Client, override_settings

from authentication.adapter import CustomSocialAccountAdapter
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

    app = get_socialaccount_adapter().get_app(None, "google", client_id=configured)

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


# Google provider: app resolution and id_token verification.
#
# Everything above runs on `dummy`, which sets `uses_apps = False` and so skips
# app resolution entirely. Google resolves an app from the `client_id` the SPA
# posts against the one SOCIALACCOUNT_PROVIDERS configures, and that app's
# client_id becomes the audience the id_token is verified against.

CONFIGURED_CLIENT_ID = "test-client.apps.googleusercontent.com"
GOOGLE_PROVIDERS = {
    "google": {"APP": {"client_id": CONFIGURED_CLIENT_ID, "secret": ""}}
}
GOOGLE_KID = "test-signing-key"
GOOGLE_SUB = "104729"
GOOGLE_EMAIL = "googler@example.com"


@functools.lru_cache(maxsize=1)
def _google_signing_key() -> tuple[rsa.RSAPrivateKey, dict[str, str]]:
    """A throwaway RSA key standing in for Google's, with the self-signed
    certificate its certs endpoint would publish for it.

    Generated lazily because RSA keygen is the slowest thing in this module.
    """
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "accounts.google.com")])
    now = datetime.datetime.now(datetime.UTC)
    certificate = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    pem = certificate.public_bytes(serialization.Encoding.PEM).decode()
    return key, {GOOGLE_KID: pem}


class _CertsResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self._payload


class _CertsSession:
    """The subset of `requests.Session` that jwtkit.fetch_key uses."""

    def __enter__(self) -> "_CertsSession":
        return self

    def __exit__(self, *exc_info: object) -> None:
        return None

    def get(self, url: str) -> _CertsResponse:
        assert url == CERTS_URL
        return _CertsResponse(_google_signing_key()[1])


class StubCertsSocialAccountAdapter(CustomSocialAccountAdapter):
    """Serves Google's certs from the local key instead of over the network.

    The narrowest seam that keeps signature, `aud`, `iss` and `exp` checking
    real: only the certs fetch is stubbed.
    """

    def get_requests_session(self) -> _CertsSession:
        return _CertsSession()


STUB_CERTS_ADAPTER = "authentication.socialaccount_test.StubCertsSocialAccountAdapter"


def _google_id_token(*, audience: str) -> str:
    key, _ = _google_signing_key()
    issued_at = int(time.time())
    return jwt.encode(
        {
            "iss": ID_TOKEN_ISSUER,
            "aud": audience,
            "sub": GOOGLE_SUB,
            "email": GOOGLE_EMAIL,
            "email_verified": True,
            "iat": issued_at,
            "exp": issued_at + 3600,
        },
        key=key,
        algorithm="RS256",
        headers={"kid": GOOGLE_KID},
    )


def _google_payload(client_id: str | None, id_token: str) -> dict:
    token: dict = {"id_token": id_token}
    if client_id is not None:
        token["client_id"] = client_id
    return {"provider": "google", "process": "login", "token": token}


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True, SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS)
def test_a_google_token_without_a_client_id_is_refused():
    """`uses_apps` is True for Google, so the client_id is what selects the app;
    without one the request stops before the id_token is read."""
    response = Client().post(
        TOKEN_URL, _google_payload(None, "unread"), content_type="application/json"
    )

    assert response.status_code == 400
    assert _codes(response) == ["client_id_required"]


@pytest.mark.django_db
@override_settings(ENABLE_REGISTRATION=True, SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS)
def test_a_google_token_for_an_unconfigured_client_id_is_refused():
    """A client_id matching no configured app resolves nothing, which is also
    what keeps an arbitrary caller from reaching Google's certs endpoint."""
    response = Client().post(
        TOKEN_URL,
        _google_payload("someone-elses-client.apps.googleusercontent.com", "unread"),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert _codes(response) == ["invalid_token"]


@pytest.mark.django_db
@override_settings(
    ENABLE_REGISTRATION=True,
    SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS,
    SOCIALACCOUNT_ADAPTER=STUB_CERTS_ADAPTER,
)
def test_a_signed_google_token_signs_up_and_logs_in():
    """The whole Google path end to end, with only the certs fetch stubbed:
    the app resolves from the client_id, the signature verifies against the
    published key, and `sub` becomes the SocialAccount uid."""
    client = Client()

    response = client.post(
        TOKEN_URL,
        _google_payload(
            CONFIGURED_CLIENT_ID, _google_id_token(audience=CONFIGURED_CLIENT_ID)
        ),
        content_type="application/json",
    )

    assert response.status_code == 200
    user = CustomUser.objects.get(email=GOOGLE_EMAIL)
    account = SocialAccount.objects.get(user=user)
    assert (account.provider, account.uid) == ("google", GOOGLE_SUB)
    assert client.session["_auth_user_id"] == str(user.pk)


@pytest.mark.django_db
@override_settings(
    ENABLE_REGISTRATION=True,
    SOCIALACCOUNT_PROVIDERS=GOOGLE_PROVIDERS,
    SOCIALACCOUNT_ADAPTER=STUB_CERTS_ADAPTER,
)
def test_a_google_token_minted_for_another_audience_is_refused():
    """The audience checked is the resolved app's client_id, so a validly
    signed token issued to a different Google client — the one thing a
    signature check alone cannot catch — buys no account here."""
    response = Client().post(
        TOKEN_URL,
        _google_payload(
            CONFIGURED_CLIENT_ID,
            _google_id_token(audience="another-client.apps.googleusercontent.com"),
        ),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert _codes(response) == ["invalid_token"]
    assert not CustomUser.objects.exists()
