from factory.django import DjangoModelFactory
from factory.faker import Faker
import authentication.models as models
from authentication.models import CustomUser

class CustomUserFactory(DjangoModelFactory):
    """Factory for LearningResourceContentTag objects"""

    email = Faker("email")

    class Meta:
        model = models.CustomUser