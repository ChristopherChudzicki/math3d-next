import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from scenes.models import Scene
from scenes.factories import SceneFactory


def _valid_scene_kwargs(key):
    data = SceneFactory.build()
    return dict(key=key, items=data.items, item_order=data.item_order, title=data.title)


@pytest.mark.django_db
@pytest.mark.parametrize("bad_key", ["app", "a", ""])
def test_reserved_key_rejected_by_full_clean(bad_key):
    # save() calls full_clean(); the validator must reject reserved keys.
    with pytest.raises(ValidationError):
        Scene(**_valid_scene_kwargs(bad_key)).save()


@pytest.mark.django_db
@pytest.mark.parametrize("bad_key", ["app", "a"])
def test_reserved_key_rejected_by_db_constraint(bad_key):
    # bulk_create bypasses full_clean(); the DB CHECK constraint must still reject.
    with pytest.raises(IntegrityError):
        Scene.objects.bulk_create([Scene(**_valid_scene_kwargs(bad_key))])


@pytest.mark.django_db
def test_normal_key_allowed():
    Scene(**_valid_scene_kwargs("tnb")).save()
    assert Scene.objects.filter(key="tnb").exists()


@pytest.mark.django_db
def test_uppercase_app_allowed():
    # Reservation is case-sensitive; only lowercase `app` collides with /app/.
    Scene(**_valid_scene_kwargs("App")).save()
    assert Scene.objects.filter(key="App").exists()
