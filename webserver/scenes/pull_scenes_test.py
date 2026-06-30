from unittest import mock

import pytest
from django.core.exceptions import ValidationError
from django.core.management.base import CommandError
from scenes.management.commands.pull_scenes import Command, upsert_scene
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


@pytest.mark.django_db
def test_upsert_scene_raises_on_invalid_items():
    """A valid key with invalid items must fail loudly, not be mistaken for a
    reserved-key skip."""
    built = SceneFactory.build()
    d = {
        "key": "goodkey",
        "items": [{"unexpected": "shape"}],
        "item_order": built.item_order,
        "title": built.title,
        "archived": False,
        "times_accessed": 0,
    }
    with pytest.raises(ValidationError):
        upsert_scene(d)
    assert not Scene.objects.filter(key="goodkey").exists()


def test_handle_runs_legacy_pull_then_reports_skips():
    """A reserved key in the source must not abort the legacy-scene pull; the
    skip is reported only after both fetch steps complete."""
    cmd = Command()
    with (
        mock.patch.object(cmd, "fetch_scenes", return_value=["app"]) as fetch_scenes,
        mock.patch.object(cmd, "fetch_legacy_scenes") as fetch_legacy,
    ):
        with pytest.raises(CommandError, match="reserved keys"):
            cmd.handle(database_url="postgres://u:p@localhost:5432/db", chunk_size=500)
    fetch_scenes.assert_called_once()
    fetch_legacy.assert_called_once()
