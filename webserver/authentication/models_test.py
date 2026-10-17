import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from faker import Faker

from authentication.factories import CustomUserFactory


faker = Faker()


@pytest.mark.django_db
def test_create_user():
    User = get_user_model()
    email = faker.email()
    user = User.objects.create_user(email=email)
    assert user.email == email
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False
    # Every account the provider flow creates has an unusable password
    # (allauth/socialaccount/adapter.py calls set_unusable_password); the
    # manager is the only other way one is made, so it must match.
    assert not user.has_usable_password()
    with pytest.raises(AttributeError):
        user.username
    with pytest.raises(TypeError):
        User.objects.create_user()  # type: ignore[call-arg]
    with pytest.raises(ValueError):
        User.objects.create_user(email="")


@pytest.mark.django_db
def test_create_superuser():
    User = get_user_model()
    email = faker.email()
    user = User.objects.create_superuser(email=email)
    assert user.email == email
    assert user.is_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
    with pytest.raises(ValueError):
        User.objects.create_superuser(email=faker.email(), is_superuser=False)


@pytest.mark.django_db
def test_factory_users_have_unusable_passwords():
    """Like every real account; tests that rest on that must not run on a
    blank password, which Django counts as usable."""
    assert not CustomUserFactory.create().has_usable_password()


@pytest.mark.django_db
def test_a_superuser_password_logs_in_at_the_admin():
    """createsuperuser is how development gets an admin."""
    email, password = faker.email(), faker.password()
    get_user_model().objects.create_superuser(email=email, password=password)
    client = Client()

    response = client.post("/admin/login/", {"username": email, "password": password})

    assert response.status_code == 302
    assert "_auth_user_id" in client.session
