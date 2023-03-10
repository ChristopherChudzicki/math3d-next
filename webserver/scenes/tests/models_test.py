from unittest import mock

import pytest
from django.db import models

from scenes.models import Scene


@mock.patch.object(models.Model, "save")
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
    # assert save_mock.called
