import pytest
from django.urls import reverse
from utils.test_utils import JsonAPIClient

from scenes.models import Scene
from scenes.factories import SceneFactory
from authentication.factories import CustomUserFactory


@pytest.mark.django_db
def test_scenes_list_returns_paginated_scenes():
    SceneFactory.create()
    SceneFactory.create(author=None)
    SceneFactory.create()

    client = JsonAPIClient()

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
    client = JsonAPIClient()
    client.force_authenticate(user)

    response = client.get(reverse("scenes-me"))
    data = response.json()
    assert data["count"] == 1
    assert data["results"][0]["key"] == scene.key


@pytest.mark.django_db
def test_scenes_me_errors_for_anon_users():
    client = JsonAPIClient()

    response = client.get(reverse("scenes-me"))
    assert response.status_code == 403


@pytest.mark.django_db
@pytest.mark.parametrize("authenticated", [False, True])
def test_scene_creation(authenticated):
    client = JsonAPIClient()
    user = CustomUserFactory.create()
    scene = SceneFactory()
    if authenticated:
        client.force_authenticate(user)

    response = client.post(
        reverse("scenes-list"),
        {"items": scene.items, "itemOrder": scene.item_order, "title": scene.title},
    )
    assert response.status_code == 201
    scene = Scene.objects.get(key=response.data["key"])
    assert scene.title == response.data["title"]
    expected_user = user if authenticated else None
    assert scene.author == expected_user


@pytest.mark.django_db
@pytest.mark.parametrize("authenticated", [False, True])
@pytest.mark.parametrize("authorized", [False, True])
def test_scene_partial_update(authenticated, authorized):
    client = JsonAPIClient()
    scene = SceneFactory.create()
    user = CustomUserFactory.create() if not authorized else scene.author
    if authenticated:
        client.force_authenticate(user)

    new_title = "new title"
    url = reverse("scenes-detail", kwargs={"key": scene.key})
    data = {"title": new_title}
    response = client.patch(url, data)
    expected_status_code = 200 if authenticated and authorized else 403
    assert response.status_code == expected_status_code

    if authenticated and authorized:
        assert Scene.objects.get(key=scene.key).title == new_title


@pytest.mark.django_db
@pytest.mark.parametrize("authenticated", [False, True])
@pytest.mark.parametrize("authorized", [False, True])
def test_scene_delete_update(authenticated, authorized):
    client = JsonAPIClient()
    scene = SceneFactory.create()
    user = CustomUserFactory.create() if not authorized else scene.author
    if authenticated:
        client.force_authenticate(user)

    new_title = "new title"
    url = reverse("scenes-detail", kwargs={"key": scene.key})
    data = {"title": new_title}
    response = client.delete(url, data)
    expected_status_code = 204 if authenticated and authorized else 403
    assert response.status_code == expected_status_code

    if authenticated and authorized:
        with pytest.raises(Scene.DoesNotExist):
            Scene.objects.get(key=scene.key)
