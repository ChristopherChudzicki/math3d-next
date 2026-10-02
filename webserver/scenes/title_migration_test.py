from importlib import import_module

import pytest
from django.apps import apps
from django.db import connection

from scenes.factories import SceneFactory
from scenes.models import Scene

migration = import_module("scenes.migrations.0022_normalize_scene_titles")


@pytest.mark.django_db
def test_normalize_titles():
    # Rows written before the constraint existed may hold line breaks.
    constraint = next(
        c for c in Scene._meta.constraints if c.name == "scene_title_single_line"
    )
    with connection.schema_editor() as editor:
        editor.remove_constraint(Scene, constraint)
    expected = {"Untitled\n": "", "a\r\nb\nc\r": "a b c", "Mine": "Mine"}
    scenes = Scene.objects.bulk_create(
        [SceneFactory.build(title=title, author=None) for title in expected]
    )

    migration.normalize_titles(apps, None)

    for scene, title in zip(scenes, expected.values()):
        scene.refresh_from_db()
        assert scene.title == title
