import pytest
from django.test import Client

from authentication.factories import CustomUserFactory
from authentication.models import CustomUser

ME_URL = "/v1/auth/users/me/"
DELETE_URL = "/v1/auth/users/me/delete/"


@pytest.mark.django_db
def test_me_get_anonymous_seeds_csrf_cookie():
    # Every page load makes this GET, and for an anonymous visitor its cookie is
    # the only source of the CSRF token the ensuing allauth POST needs. Seeding
    # must happen before the auth gate — regression guard for the cookie being
    # skipped on the rejected anonymous request.
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
def test_delete_removes_account():
    """
    The session is the only gate. Provider accounts have unusable passwords, so
    a password check would lock every OAuth user out of deleting their own
    account (ADR-0004).
    """
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)

    response = client.post(DELETE_URL, data={}, content_type="application/json")

    assert response.status_code == 204
    assert not CustomUser.objects.filter(id=user.id).exists()


@pytest.mark.django_db
def test_delete_requires_auth():
    # delete_me is auth=session_auth; an anonymous POST is rejected.
    response = Client().post(DELETE_URL, data={}, content_type="application/json")
    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_flushes_session():
    # delete_me calls request.session.flush(); without it the session would retain
    # _auth_user_id pointing at the now-deleted user. Asserting the key is gone
    # distinguishes the flush from the user-row deletion alone.
    user = CustomUserFactory.create()
    client = Client()
    client.force_login(user)

    response = client.post(DELETE_URL, data={}, content_type="application/json")

    assert response.status_code == 204
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_delete_enforces_csrf():
    user = CustomUserFactory.create()
    client = Client(enforce_csrf_checks=True)
    client.force_login(user)

    response = client.post(DELETE_URL, content_type="application/json")

    assert response.status_code == 403
    assert CustomUser.objects.filter(pk=user.pk).exists()
