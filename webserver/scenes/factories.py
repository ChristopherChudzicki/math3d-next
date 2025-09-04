from typing import Generic, TypeVar

import factory
import faker
from factory.django import DjangoModelFactory

from scenes.models import Scene
from authentication.factories import CustomUserFactory

fake = faker.Faker()

T = TypeVar("T")


class BaseFactory(DjangoModelFactory, Generic[T]):
    # Type hinting for Factory.create()
    @classmethod
    def create(cls, **kwargs) -> T:
        return super().create(**kwargs)

    # Type hinting Factory()
    def __new__(cls, *args, **kwargs) -> T:  # type: ignore
        return super().__new__(*args, **kwargs)


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

    title = factory.LazyFunction(lambda: fake.sentence(nb_words=3))

    author = factory.SubFactory(CustomUserFactory)  # type: ignore

    archived = factory.LazyFunction(lambda: fake.boolean())

    is_legacy = factory.LazyFunction(lambda: fake.boolean())

    class Meta:
        model = Scene
