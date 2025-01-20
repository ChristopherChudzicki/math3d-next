import pytest
from django.urls import reverse
from utils.test_utils import JsonAPIClient

from scenes.models import LegacyScene, Scene
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
    assert response.status_code == 401


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

    if not authenticated:
        expected_status_code = 401
    elif not authorized:
        expected_status_code = 403
    else:
        expected_status_code = 200
    assert response.status_code == expected_status_code

    if authenticated and authorized:
        assert Scene.objects.get(key=scene.key).title == new_title


@pytest.mark.django_db
def test_scene_partial_update_no_author_update():
    client = JsonAPIClient()
    scene = SceneFactory.create()
    user = scene.author
    client.force_authenticate(user)
    url = reverse("scenes-detail", kwargs={"key": scene.key})
    data = {"author": user.id + 1}
    response = client.patch(url, data)
    assert response.data["author"] == user.id


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
    if not authenticated:
        expected_status_code = 401
    elif not authorized:
        expected_status_code = 403
    else:
        expected_status_code = 204
    assert response.status_code == expected_status_code

    if authenticated and authorized:
        with pytest.raises(Scene.DoesNotExist):
            Scene.objects.get(key=scene.key)


@pytest.mark.django_db
def test_scenes_me_list_filtering():
    user = CustomUserFactory.create()
    scene_dogbark = SceneFactory.create(title="dog bark", author=user)
    scene_dogwoof = SceneFactory.create(title="dog woof", author=user)
    SceneFactory.create(title="cat meow", author=user)
    client = JsonAPIClient()
    client.force_authenticate(user)

    unfiltered_response = client.get(reverse("scenes-me"))
    unfiltered_data = unfiltered_response.json()
    assert unfiltered_data["count"] == 3

    filtered_response = client.get(reverse("scenes-me"), {"title": "dog"})
    filtered_data = filtered_response.json()
    assert filtered_data["count"] == 2
    assert {scene["title"] for scene in filtered_data["results"]} == {
        scene_dogbark.title,
        scene_dogwoof.title,
    }


@pytest.mark.django_db
def test_legacy_scene_create_retrieve():
    client = JsonAPIClient()

    payload = {"dehydrated": {"Whatever": "it's not validated"}}
    response = client.post(reverse("legacy_scenes-list"), payload)
    print(response.data)
    assert response.status_code == 201
    scene = LegacyScene.objects.get(key=response.data["key"])
    assert scene.dehydrated == payload["dehydrated"]

    retrieved = client.get(reverse("legacy_scenes-detail", kwargs={"key": scene.key}))
    assert retrieved.data == response.data


@pytest.mark.django_db
def test_legacy_scene_not_implemented_methods():
    client = JsonAPIClient()

    assert client.get(reverse("legacy_scenes-list")).status_code == 405
    assert (
        client.patch(
            reverse("legacy_scenes-detail", kwargs={"key": "whatever"})
        ).status_code
        == 405
    )
    assert (
        client.put(
            reverse("legacy_scenes-detail", kwargs={"key": "whatever"})
        ).status_code
        == 405
    )
