from factory.django import DjangoModelFactory
from factory.faker import Faker
import authentication.models as models

class CustomUserFactory(DjangoModelFactory):
    """Factory for LearningResourceContentTag objects"""

    email = Faker("email")
    public_nickname = Faker("name")

    class Meta:
        model = models.CustomUser