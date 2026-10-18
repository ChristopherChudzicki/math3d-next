import datetime
import zoneinfo

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from scenes.factories import SceneFactory
from scenes.models import Scene, is_invalid_key_error


def _valid_scene_kwargs(key):
    data = SceneFactory.build()
    return {
        "key": key,
        "items": data.items,
        "item_order": data.item_order,
        "title": data.title,
    }


@pytest.mark.django_db
# "ab\n": Python's `$` would match before the newline; the pattern uses `\Z`.
@pytest.mark.parametrize("bad_key", ["app", "App", "a", "a.b", "ab\n"])
def test_invalid_key_rejected_by_full_clean(bad_key):
    # save() calls full_clean(). The error must come from the key validator, not
    # only the CHECK constraint (a non-field error): callers skip on key errors.
    with pytest.raises(ValidationError) as exc_info:
        Scene(**_valid_scene_kwargs(bad_key)).save()
    assert is_invalid_key_error(exc_info.value)


@pytest.mark.django_db
@pytest.mark.parametrize("bad_key", ["app", "a", "a.b"])
def test_invalid_key_rejected_by_db_constraint(bad_key):
    # bulk_create bypasses full_clean(); the DB CHECK constraint must still reject.
    with pytest.raises(IntegrityError):
        Scene.objects.bulk_create([Scene(**_valid_scene_kwargs(bad_key))])


@pytest.mark.django_db
def test_normal_key_allowed():
    Scene(**_valid_scene_kwargs("sliders_intro")).save()
    assert Scene.objects.filter(key="sliders_intro").exists()


@pytest.mark.django_db
def test_multiline_title_rejected_by_db_constraint():
    kwargs = {**_valid_scene_kwargs("tnb"), "title": "a\nb"}
    with pytest.raises(IntegrityError):
        Scene.objects.bulk_create([Scene(**kwargs)])


@pytest.mark.django_db
def test_is_invalid_key_error_false_for_invalid_items():
    # A valid key with invalid items fails full_clean() under "items", not "key";
    # this must not be mistaken for an invalid-key error.
    kwargs = _valid_scene_kwargs("goodkey")
    kwargs["items"] = [{"unexpected": "shape"}]
    with pytest.raises(ValidationError) as exc_info:
        Scene(**kwargs).save()
    assert not is_invalid_key_error(exc_info.value)


@pytest.mark.django_db
def test_created_modified_timestamps():
    scene = Scene(**_valid_scene_kwargs("timestamps"))
    scene.save()

    assert scene.created_date == scene.modified_date

    scene.save()

    assert scene.modified_date > scene.created_date


@pytest.mark.django_db
def test_save_update_fields_narrows_the_update():
    """save(update_fields=...) must reach Model.save, and carry modified_date."""
    scene = SceneFactory.create()
    before = scene.modified_date
    was_archived = scene.archived

    scene.title = "New title"
    scene.archived = not was_archived
    scene.save(update_fields=["title"])

    scene.refresh_from_db()
    assert scene.title == "New title"
    assert scene.archived == was_archived  # unlisted, so never written
    assert scene.modified_date > before


@pytest.mark.django_db
def test_save_with_empty_update_fields_skips_the_db_write():
    scene = SceneFactory.create()
    before = scene.modified_date

    scene.save(update_fields=[])

    assert scene.modified_date == before  # in memory, not only in the row
    scene.refresh_from_db()
    assert scene.modified_date == before


def test_screenshot_version_is_canonical_utc_with_microseconds():
    # The same instant must always name the same version: the Worker matches
    # it exactly against the image URL's v.
    instant = datetime.datetime(2026, 10, 2, 1, 53, 32, tzinfo=datetime.UTC)
    elsewhere = instant.astimezone(zoneinfo.ZoneInfo("America/New_York"))
    assert Scene(key="ab", content_modified_date=instant).screenshot_version == (
        "2026-10-02T01:53:32.000000+00:00"
    )
    assert Scene(key="ab", content_modified_date=elsewhere).screenshot_version == (
        Scene(key="ab", content_modified_date=instant).screenshot_version
    )


def test_screenshot_version_distinguishes_microseconds():
    instant = datetime.datetime(2026, 10, 2, 1, 53, 32, 1, tzinfo=datetime.UTC)
    later = instant + datetime.timedelta(microseconds=1)
    assert (
        Scene(key="ab", content_modified_date=instant).screenshot_version
        != Scene(key="ab", content_modified_date=later).screenshot_version
    )
