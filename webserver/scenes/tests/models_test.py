import pytest
from django.db import models

from scenes.models import Scene


@pytest.mark.django_db
def test_my_user(save_mock):
    scene = Scene(
        key="fake",
        items=[1],
        item_order={"cat": []},
        title="fake",
        created_at="2021-01-01 00:00:00",
    )
    scene.save()
