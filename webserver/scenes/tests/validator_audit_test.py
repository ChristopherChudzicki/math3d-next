import pytest
from django.core.exceptions import ValidationError as DjangoValidationError

from scenes.factories import SceneFactory
from scenes.models import Scene
from scenes.tests.data import default_scene
from scenes.validators import validate_math_items


def test_validator_accepts_the_v0_corpus():
    # The v0 test corpus has been JTD-validated on save since 0001; the new
    # Pydantic contract must accept it unchanged (D7 audit). NOTE: default_scene()
    # exercises only 5 of 16 types (Axis, Grid, Folder, ExplicitSurface, Camera);
    # the other 11 are validated end-to-end by Task 4's schema.spec.ts (each
    # configs[type].make() vs the v1 spec) + the TS assignability check.
    validate_math_items(default_scene()["items"])


@pytest.mark.django_db
def test_validator_accepts_factory_items():
    scene = SceneFactory.create()
    validate_math_items(scene.items)


def test_validator_raises_django_validation_error_on_bad_item():
    bad = [{"id": "x", "type": "FOLDER", "properties": {"description": "d"}}]
    with pytest.raises(DjangoValidationError):
        validate_math_items(bad)


@pytest.mark.django_db
def test_scene_save_still_validates_items():
    data = default_scene()
    data["items"][0]["properties"]["surprise"] = "boom"
    scene = Scene(key="bad", items=data["items"], item_order=data["itemOrder"])
    with pytest.raises(DjangoValidationError):
        scene.save()
