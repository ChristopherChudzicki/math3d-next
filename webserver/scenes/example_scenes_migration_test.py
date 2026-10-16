from importlib import import_module

import pytest
from django.apps import apps

from scenes.factories import SceneFactory
from scenes.models import ExampleScene

migration = import_module("scenes.migrations.0026_seed_example_scenes")


@pytest.mark.django_db
def test_seed_keeps_list_order_and_skips_missing_keys():
    present = migration.EXAMPLE_KEYS[::2]
    for key in reversed(present):
        SceneFactory.create(key=key)

    migration.seed(apps, None)

    assert [e.scene.key for e in ExampleScene.objects.all()] == present
