import pytest
from scenes.management.commands.pull_scenes import upsert_scene
from scenes.models import Scene
from scenes.factories import SceneFactory


@pytest.mark.django_db
def test_upsert_scene_creates_valid():
    built = SceneFactory.build()
    d = {
        "key": "goodkey",
        "items": built.items,
        "item_order": built.item_order,
        "title": built.title,
        "archived": False,
        "times_accessed": 0,
    }
    assert upsert_scene(d) is True
    assert Scene.objects.filter(key="goodkey").exists()


@pytest.mark.django_db
def test_upsert_scene_skips_reserved():
    built = SceneFactory.build()
    d = {
        "key": "a",
        "items": built.items,
        "item_order": built.item_order,
        "title": built.title,
        "archived": False,
        "times_accessed": 0,
    }
    assert upsert_scene(d) is False
    assert not Scene.objects.filter(key="a").exists()
