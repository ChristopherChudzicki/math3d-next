from importlib import import_module

import pytest
from django.apps import apps

from scenes.factories import SceneFactory
from scenes.models import Scene

migration = import_module("scenes.migrations.0028_strip_outer_color_mod")


def surface(rhs: str, wrap_colors: str | None = None):
    """A surface saved before ``wrapColors`` existed, unless it's given."""
    properties: dict = {
        "colorExpr": {
            "type": "function-assignment",
            "name": "_f",
            "params": ["x", "y", "z"],
            "rhs": rhs,
        },
    }
    if wrap_colors is not None:
        properties["wrapColors"] = wrap_colors
    return {"id": "s", "type": "EXPLICIT_SURFACE", "properties": properties}


def stored(scene) -> dict:
    return Scene.objects.get(pk=scene.pk).items[0]["properties"]


@pytest.mark.django_db
def test_strips_an_outer_mod_on_owned_scenes_and_wraps():
    scene = SceneFactory.create(is_legacy=False)
    Scene.objects.filter(pk=scene.pk).update(items=[surface("mod(z, 1)")])

    migration.forward(apps, None)

    props = stored(scene)
    assert (props["colorExpr"]["rhs"], props["wrapColors"]) == ("z", "true")


@pytest.mark.django_db
def test_drops_a_mod_with_period_0_and_keeps_the_wrap_setting():
    scene = SceneFactory.create(is_legacy=False)
    Scene.objects.filter(pk=scene.pk).update(items=[surface("mod(z, 0)", "true")])

    migration.forward(apps, None)

    props = stored(scene)
    assert (props["colorExpr"]["rhs"], props["wrapColors"]) == ("z", "true")


@pytest.mark.django_db
def test_leaves_other_expressions_and_legacy_rows():
    kept = SceneFactory.create(is_legacy=False)
    legacy = SceneFactory.create(is_legacy=True)
    Scene.objects.filter(pk=kept.pk).update(items=[surface("mod(z, 2)")])
    Scene.objects.filter(pk=legacy.pk).update(items=[surface("mod(z, 1)")])

    migration.forward(apps, None)

    assert stored(kept) == surface("mod(z, 2)")["properties"]
    assert stored(legacy) == surface("mod(z, 1)")["properties"]


@pytest.mark.django_db
def test_keeps_an_expression_bound_to_wrap_colors():
    scene = SceneFactory.create(is_legacy=False)
    Scene.objects.filter(pk=scene.pk).update(items=[surface("mod(z, 1)", "b")])

    migration.forward(apps, None)

    assert stored(scene) == surface("mod(z, 1)", "b")["properties"]
