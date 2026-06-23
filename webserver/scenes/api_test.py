import pytest
from django.test import Client

from authentication.factories import CustomUserFactory
from scenes.factories import SceneFactory

LIST_URL = "/v1/scenes/"
ME_URL = "/v1/scenes/me/"


@pytest.mark.django_db
def test_list_returns_limitoffset_envelope_id_asc():
    s1 = SceneFactory.create()
    s2 = SceneFactory.create()
    response = Client().get(LIST_URL)
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "count"}
    assert body["count"] == 2
    keys = [item["key"] for item in body["items"]]
    assert keys == [s1.key, s2.key]  # id-asc (Scene.Meta.ordering = ["id"])


@pytest.mark.django_db
def test_list_item_shape_aliases_dates():
    SceneFactory.create()
    item = Client().get(LIST_URL).json()["items"][0]
    assert set(item.keys()) == {
        "title",
        "key",
        "author",
        "createdDate",
        "modifiedDate",
        "archived",
    }
    assert "items" not in item and "itemOrder" not in item


@pytest.mark.django_db
def test_list_default_limit_is_20():
    for _ in range(21):
        SceneFactory.create()
    body = Client().get(LIST_URL).json()
    assert body["count"] == 21
    assert len(body["items"]) == 20


@pytest.mark.django_db
def test_list_title_filter_icontains():
    SceneFactory.create(title="Alpha Curve")
    SceneFactory.create(title="Beta Surface")
    body = Client().get(LIST_URL, {"title": "alpha"}).json()
    assert [i["title"] for i in body["items"]] == ["Alpha Curve"]


@pytest.mark.django_db
def test_list_archived_filter():
    SceneFactory.create(archived=True)
    SceneFactory.create(archived=False)
    body = Client().get(LIST_URL, {"archived": "true"}).json()
    assert body["count"] == 1
    assert body["items"][0]["archived"] is True


@pytest.mark.django_db
def test_list_absent_archived_returns_all():
    # FilterSchema footgun: an absent param must mean "no filter", not archived=False.
    SceneFactory.create(archived=True)
    SceneFactory.create(archived=False)
    assert Client().get(LIST_URL).json()["count"] == 2


@pytest.mark.django_db
def test_me_requires_auth():
    assert Client().get(ME_URL).status_code == 403


@pytest.mark.django_db
def test_me_returns_only_my_scenes():
    me = CustomUserFactory.create()
    mine = SceneFactory.create(author=me)
    SceneFactory.create()  # someone else's
    client = Client()
    client.force_login(me)
    body = client.get(ME_URL).json()
    assert [i["key"] for i in body["items"]] == [mine.key]


from scenes.models import LegacyScene  # noqa: E402

LEGACY_URL = "/v1/legacy_scenes/"


@pytest.mark.django_db
def test_legacy_post_creates_and_returns_201():
    response = Client().post(
        LEGACY_URL,
        data={"dehydrated": {"some": "blob"}},
        content_type="application/json",
    )
    assert response.status_code == 201
    body = response.json()
    assert body["dehydrated"] == {"some": "blob"}
    assert LegacyScene.objects.filter(key=body["key"]).exists()


@pytest.mark.django_db
def test_legacy_get_increments_and_saves_times_accessed():
    scene = LegacyScene.objects.create(dehydrated={"a": 1})
    assert scene.times_accessed == 0
    response = Client().get(f"{LEGACY_URL}{scene.key}/")
    assert response.status_code == 200
    assert response.json() == {"key": scene.key, "dehydrated": {"a": 1}}
    scene.refresh_from_db()
    assert scene.times_accessed == 1


@pytest.mark.django_db
def test_legacy_list_returns_405():
    assert Client().get(LEGACY_URL).status_code == 405
