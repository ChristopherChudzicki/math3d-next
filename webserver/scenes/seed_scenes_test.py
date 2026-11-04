import json
from pathlib import Path
from unittest import mock

import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import Client

from scenes.factories import ExampleSceneFactory, SceneFactory
from scenes.models import ExampleScene, LegacyScene, Scene
from scenes.seed_scenes import (
    SEED_DIR,
    ExampleRef,
    SeedScene,
    SeedSceneError,
    dump_seed_scene,
    load_seed_scenes,
    read_seed_scene,
    seed_scene_paths,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def qa_path() -> Path:
    return min((SEED_DIR / "qa").glob("*.json"))


@pytest.fixture
def qa_seed(qa_path) -> SeedScene:
    return read_seed_scene(qa_path)


def load_one(seed: SeedScene) -> tuple[Scene, str]:
    [(scene, status)] = load_seed_scenes([seed])
    return scene, status


def test_load_creates_then_reports_unchanged(qa_seed):
    _, first = load_one(qa_seed)
    _, second = load_one(qa_seed)
    assert (first, second) == ("created", "unchanged")


def test_load_updates_by_key(qa_seed):
    created, _ = load_one(qa_seed)
    scene, status = load_one(qa_seed.model_copy(update={"title": "renamed"}))
    assert (scene.pk, status, scene.title) == (created.pk, "updated", "renamed")


def test_load_refuses_a_users_scene(qa_seed):
    existing = SceneFactory()
    with pytest.raises(ValidationError, match="not overwriting"):
        load_one(qa_seed.model_copy(update={"key": existing.key}))


def test_load_takes_over_a_legacy_scene(qa_seed):
    legacy = LegacyScene.objects.create(dehydrated={})
    SceneFactory(key=legacy.key, author=None, is_legacy=True)
    scene, status = load_one(qa_seed.model_copy(update={"key": legacy.key}))
    assert (status, scene.is_legacy) == ("updated", False)
    with mock.patch("scenes.api.migrate_scene") as migrate:
        response = Client().get(f"/v1/scenes/{legacy.key}/")
    assert response.json()["title"] == qa_seed.title
    migrate.assert_not_called()


@pytest.mark.django_db(transaction=True)
def test_content_change_moves_the_screenshot_version(qa_seed):
    # transaction=True so schedule_render's on_commit hook fires.
    with mock.patch("scenes.screenshots.maybe_render") as maybe:
        created, _ = load_one(qa_seed)
        load_one(qa_seed.model_copy(update={"title": "renamed"}))
        renamed = Scene.objects.get(key=qa_seed.key)
        load_one(qa_seed.model_copy(update={"item_order": {"main": []}}))
        edited = Scene.objects.get(key=qa_seed.key)
    assert renamed.screenshot_version == created.screenshot_version
    assert edited.screenshot_version > created.screenshot_version
    assert maybe.call_args_list == [
        mock.call(qa_seed.key, created.screenshot_version),
        mock.call(qa_seed.key, edited.screenshot_version),
    ]


def test_example_positions_swap_in_one_load(qa_seed):
    a = qa_seed.model_copy(update={"key": "ex_a", "example": ExampleRef(position=10)})
    b = qa_seed.model_copy(update={"key": "ex_b", "example": ExampleRef(position=20)})
    load_seed_scenes([a, b])
    swapped = [
        a.model_copy(update={"example": ExampleRef(position=20)}),
        b.model_copy(update={"example": ExampleRef(position=10)}),
    ]
    statuses = [status for _, status in load_seed_scenes(swapped)]
    assert statuses == ["updated", "updated"]
    assert [e.scene.key for e in ExampleScene.objects.all()] == ["ex_b", "ex_a"]


def test_dropping_the_example_removes_it_from_the_list(qa_seed):
    load_one(qa_seed.model_copy(update={"example": ExampleRef(position=10)}))
    _, status = load_one(qa_seed)
    assert status == "updated"
    assert not ExampleScene.objects.exists()


def test_load_refuses_a_position_held_by_a_scene_without_a_seed(qa_seed):
    other = ExampleSceneFactory.create(position=10)
    with pytest.raises(ValidationError, match=other.scene.key):
        load_one(qa_seed.model_copy(update={"example": ExampleRef(position=10)}))


@pytest.mark.parametrize(
    "update",
    [{}, {"example": ExampleRef(position=10)}],
    ids=["same key", "same position"],
)
def test_load_refuses_duplicates_across_seeds(qa_seed, update):
    a = qa_seed.model_copy(update={"key": "ex_a", **update})
    b = qa_seed.model_copy(update={"key": "ex_b" if update else "ex_a", **update})
    with pytest.raises(ValidationError, match="share"):
        load_seed_scenes([a, b])
    assert not Scene.objects.filter(key__startswith="ex_").exists()


def test_dump_round_trips_an_example(qa_seed):
    seed = qa_seed.model_copy(update={"example": ExampleRef(position=30)})
    scene, _ = load_one(seed)
    assert dump_seed_scene(scene)["example"] == {"position": 30}


@pytest.mark.parametrize("path", seed_scene_paths(), ids=lambda p: p.stem)
def test_every_committed_file_round_trips(path):
    scene, _ = load_one(read_seed_scene(path))
    dumped, stored = dump_seed_scene(scene), json.loads(path.read_text())
    assert dumped == stored
    assert list(dumped) == list(stored)


@pytest.mark.parametrize(
    "bad",
    [{"exmaple": {"position": 3}}, {"key": "app"}],
    ids=["unknown field", "invalid key"],
)
def test_read_rejects_a_bad_file_by_name(qa_path, tmp_path, bad):
    path = tmp_path / "bad.json"
    path.write_text(json.dumps(json.loads(qa_path.read_text()) | bad))
    with pytest.raises(SeedSceneError, match="bad.json"):
        read_seed_scene(path)


def test_command_fails_before_writing_on_a_bad_file(qa_path, qa_seed, tmp_path):
    bad = tmp_path / "bad.json"
    bad.write_text("{}")
    with pytest.raises(CommandError, match="bad.json"):
        call_command("load_seed_scenes", str(qa_path), str(bad))
    assert not Scene.objects.filter(key=qa_seed.key).exists()


def test_command_loads_every_committed_file_by_default():
    call_command("load_seed_scenes")
    keys = {read_seed_scene(path).key for path in seed_scene_paths()}
    assert set(Scene.objects.filter(key__in=keys).values_list("key", flat=True)) == keys
