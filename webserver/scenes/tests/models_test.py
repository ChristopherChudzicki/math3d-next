import pytest
from django.core.exceptions import ValidationError

from scenes.factories import SceneFactory
from scenes.models import Scene
from scenes.tests.data import default_scene


@pytest.mark.django_db
def test_valid_items_are_saveable():
    data = default_scene()
    scene = Scene(
        key="fake",
        items=data["items"],
        item_order=data["itemOrder"],
        title=data["title"],
    )
    scene.save()


@pytest.mark.django_db
def test_invalid_items_raise_validation_error():
    data = default_scene()
    data["items"][0]["properties"]["extra"] = "bad_prop"
    scene = Scene(
        key="fake",
        items=data["items"],
        item_order=data["itemOrder"],
        title=data["title"],
    )
    with pytest.raises(ValidationError):
        scene.save()


@pytest.mark.django_db
def test_deleting_an_author_preserves_their_scenes():
    """
    Deleting an account must not destroy the scenes it published: their links
    are shared and outlive the account (ADR-0004). The scene is orphaned, not
    cascaded.
    """
    scene = SceneFactory.create()

    scene.author.delete()

    scene.refresh_from_db()
    assert scene.author is None
