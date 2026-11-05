from importlib import import_module

import pytest
from django.apps import apps

from scenes.factories import SceneFactory
from scenes.models import LegacyScene, Scene

migration = import_module("scenes.migrations.0027_mark_legacy_translations")


@pytest.mark.django_db
def test_mark_flags_only_authorless_rows_under_a_legacy_key():
    unflagged = SceneFactory.create(author=None, is_legacy=False)
    authored = SceneFactory.create(is_legacy=False)
    native = SceneFactory.create(author=None, is_legacy=False)
    for scene in (unflagged, authored):
        LegacyScene.objects.create(key=scene.key, dehydrated={})

    migration.mark(apps, None)

    flags = {
        scene.key: Scene.objects.get(pk=scene.pk).is_legacy
        for scene in (unflagged, authored, native)
    }
    assert flags == {unflagged.key: True, authored.key: False, native.key: False}
