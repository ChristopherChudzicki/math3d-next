from typing import Generic, TypeVar

import factory
import faker
from factory.django import DjangoModelFactory

from scenes.models import Scene
from authentication.factories import CustomUserFactory

fake = faker.Faker()

T = TypeVar("T")


class BaseFactory(DjangoModelFactory, Generic[T]):
    @classmethod
    def create(cls, **kwargs) -> T:
        return super().create(**kwargs)


class SceneFactory(BaseFactory[Scene]):
    """Factory for LearningResourceContentTag objects"""

    key = factory.LazyFunction(fake.uuid4)
    items = factory.LazyFunction(
        lambda: [
            {
                "id": "initialFolder",
                "type": "FOLDER",
                "properties": {"description": "A Folder", "isCollapsed": "false"},
            }
        ]
    )
    item_order = factory.LazyFunction(
        lambda: {"main": ["initialFolder"], "initialFolder": []}
    )

    author = factory.SubFactory(CustomUserFactory)  # type: ignore

    class Meta:
        model = Scene
