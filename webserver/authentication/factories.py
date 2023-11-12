import factory
from factory.django import DjangoModelFactory
from factory.faker import Faker

import authentication.models as models


class CustomUserFactory(DjangoModelFactory):
    """Factory for LearningResourceContentTag objects"""

    email = Faker("email")
    public_nickname = Faker("name")

    @factory.post_generation
    def set_password(self, create, extracted, **kwargs):
        self.set_password("testpassword")
        self.save()

    class Meta:
        model = models.CustomUser
        skip_postgeneration_save = True
