import pytest
from django.db import models
from django.core.exceptions import ValidationError

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
        created_at="2021-01-01 00:00:00",
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
        created_at="2021-01-01 00:00:00",
    )
    with pytest.raises(ValidationError):
        scene.save()
