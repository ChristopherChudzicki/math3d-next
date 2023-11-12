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
    """Factory for LearningResourceContentTag objects"""

    email = factory.LazyFunction(fake.email)
    public_nickname = factory.LazyFunction(fake.first_name)

    @factory.post_generation
    def set_password(self, create, extracted, **kwargs):
        self.set_password("testpassword")
        self.save()

    class Meta:
        model = models.CustomUser
        skip_postgeneration_save = True
