import pytest
from django.contrib.auth import get_user_model
from faker import Faker


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
        User.objects.create_user()
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
