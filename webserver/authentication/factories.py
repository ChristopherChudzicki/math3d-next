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

    class Meta:
        model = models.CustomUser
        skip_postgeneration_save = True
