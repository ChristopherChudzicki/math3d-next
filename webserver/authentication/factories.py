from typing import Generic, TypeVar

import factory
import faker
from factory.django import DjangoModelFactory

import authentication.models as models

fake = faker.Faker()

T = TypeVar("T")


class BaseFactory(DjangoModelFactory, Generic[T]):
    @classmethod
    def create(cls, **kwargs) -> T:
        return super().create(**kwargs)


class CustomUserFactory(BaseFactory[models.CustomUser]):
    """Factory for CustomUser objects."""

    email = factory.LazyFunction(fake.email)
    # DjangoModelFactory bypasses create_user, which would leave a blank password
    # that Django counts as usable; real accounts have an unusable one.
    password = factory.django.Password(None)

    class Meta:
        model = models.CustomUser
