import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from scenes.factories import SceneFactory


@pytest.mark.django_db
def test_scenes_list_returns_paginated_scenes():
    SceneFactory.create()
    SceneFactory.create(author=None)
    SceneFactory.create()

    client = APIClient()

    response = client.get(reverse("scenes-list"))
    data = response.json()
    assert data["count"] == 3
    assert "next" in data
    assert "previous" in data


@pytest.mark.django_db
def test_scenes_me_returns_my_scenes_only():
    scene = SceneFactory.create()
    SceneFactory.create(author=None)
    SceneFactory.create()

    user = scene.author
    client = APIClient()
    client.force_authenticate(user)

    response = client.get(reverse("scenes-me"))
    data = response.json()
    assert data["count"] == 1
    assert data["results"][0]["key"] == scene.key


@pytest.mark.django_db
def test_scenes_me_errors_for_anon_users():
    client = APIClient()

    response = client.get(reverse("scenes-me"))
    assert response.status_code == 403
