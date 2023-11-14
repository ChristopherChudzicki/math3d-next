import pytest
from django.contrib.auth import get_user_model
from faker import Faker


faker = Faker()


@pytest.mark.django_db
def test_create_user():
    User = get_user_model()
    email = faker.email()
    password = faker.password()
    user = User.objects.create_user(email=email, password=password)
    assert user.email == email
    assert user.is_active == False
    assert user.is_staff == False
    assert user.is_superuser == False
    with pytest.raises(AttributeError):
        user.username
    with pytest.raises(TypeError):
        User.objects.create_user()
    with pytest.raises(TypeError):
        User.objects.create_user(email="")
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password="foo")


@pytest.mark.django_db
def test_create_superuser():
    User = get_user_model()
    email = faker.email()
    password = faker.password()
    user = User.objects.create_superuser(email=email, password=password)
    assert user.email == email
    assert user.is_active == True
    assert user.is_staff == True
    assert user.is_superuser == True
    with pytest.raises(ValueError):
        user = User.objects.create_superuser(
            email=faker.email(), password=faker.password(), is_superuser=False
        )
