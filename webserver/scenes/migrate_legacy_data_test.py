import copy

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from scenes.api_test import LEGACY_DEHYDRATED_FIXTURE
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
