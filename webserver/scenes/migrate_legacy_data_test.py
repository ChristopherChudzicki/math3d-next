import copy

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from scenes.api_test import LEGACY_DEHYDRATED_FIXTURE
from scenes.legacy_scene_utils.migrate_scene import migrate_scene
from scenes.models import LegacyScene, Scene


def _legacy(**graphics):
    dehydrated = copy.deepcopy(LEGACY_DEHYDRATED_FIXTURE)
    dehydrated["mathGraphics"] = graphics
    return LegacyScene.objects.create(dehydrated=dehydrated)


BROKEN = {"type": "NOT_A_TYPE"}
UNKNOWN_PROPERTY = {"type": "POINT", "samples": "5"}


@pytest.mark.django_db
def test_a_failing_scene_aborts_the_batch_by_default():
    _legacy(p=BROKEN)
    good = _legacy()
    with pytest.raises(CommandError, match="1 scenes had problems"):
        call_command("migrate_legacy_data")
    assert not Scene.objects.filter(key=good.key).exists()


@pytest.mark.django_db
def test_failures_up_to_max_failures_are_skipped_and_reported(capsys):
    _legacy(p=BROKEN)
    good = _legacy()
    call_command("migrate_legacy_data", "--max-failures", "1")
    assert Scene.objects.filter(key=good.key).exists()
    assert "1 scenes had problems" in capsys.readouterr().out


@pytest.mark.django_db
def test_ignored_unknown_properties_count_as_problems():
    legacy = _legacy(p=UNKNOWN_PROPERTY)
    with pytest.raises(CommandError, match="Ignored unknown POINT properties"):
        call_command("migrate_legacy_data")
    legacy.refresh_from_db()
    assert (
        legacy.migration_note == "WARNING p: Ignored unknown POINT properties: samples"
    )


@pytest.mark.django_db
def test_error_issues_count_as_problems():
    _legacy(v={"type": "VECTOR_FIELD", "samples": "[1, 2]"})
    with pytest.raises(CommandError, match="Invalid vector field samples"):
        call_command("migrate_legacy_data")


@pytest.fixture
def taken_over():
    """A legacy scene whose Scene row something owns (is_legacy=False)."""
    legacy = _legacy()
    migrate_scene(legacy)
    Scene.objects.filter(key=legacy.key).update(is_legacy=False, title="owned")
    return legacy


@pytest.mark.django_db
def test_taken_over_scenes_are_skipped_by_default(taken_over, capsys):
    call_command("migrate_legacy_data")
    scene = Scene.objects.get(key=taken_over.key)
    assert (scene.title, scene.is_legacy) == ("owned", False)
    assert "Skipping 1 taken-over" in capsys.readouterr().out


@pytest.mark.django_db
def test_force_must_name_the_number_of_scenes_it_overwrites(taken_over):
    with pytest.raises(CommandError, match="--force 1"):
        call_command("migrate_legacy_data", "--force", "2")
    assert Scene.objects.get(key=taken_over.key).title == "owned"
    call_command("migrate_legacy_data", "--force", "1")
    assert Scene.objects.get(key=taken_over.key).is_legacy is True


@pytest.mark.django_db
def test_force_counts_taken_over_scenes_within_the_limited_batch(taken_over):
    second = _legacy()
    migrate_scene(second)
    Scene.objects.filter(key=second.key).update(is_legacy=False)
    call_command("migrate_legacy_data", "--limit", "1", "--force", "1")
    assert Scene.objects.get(key=taken_over.key).is_legacy is True
    assert Scene.objects.get(key=second.key).is_legacy is False
