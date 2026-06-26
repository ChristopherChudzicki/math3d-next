import pytest
from django.test import Client

from authentication.factories import CustomUserFactory
from scenes.factories import SceneFactory
from scenes.models import LegacyScene, Scene
from scenes.tests.data import default_scene

LIST_URL = "/v1/scenes/"
ME_URL = "/v1/scenes/me/"
LEGACY_URL = "/v1/legacy_scenes/"


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


def _detail(key):
    return f"/v1/scenes/{key}/"


@pytest.mark.django_db
def test_post_anonymous_creates_with_null_author_and_server_key():
    data = default_scene()
    body = {"items": data["items"], "itemOrder": data["itemOrder"], "title": "Mine"}
    response = Client().post(LIST_URL, data=body, content_type="application/json")
    assert response.status_code == 201
    out = response.json()
    assert out["author"] is None
    assert out["key"]  # server-generated
    assert out["title"] == "Mine"
    assert out["isLegacy"] is False


@pytest.mark.django_db
def test_post_authenticated_sets_author_to_self():
    me = CustomUserFactory.create()
    client = Client()
    client.force_login(me)
    data = default_scene()
    body = {"items": data["items"], "itemOrder": data["itemOrder"]}
    out = client.post(LIST_URL, data=body, content_type="application/json").json()
    assert out["author"] == me.id


@pytest.mark.django_db
def test_post_rejects_malformed_item_with_400():
    data = default_scene()
    data["items"][0]["properties"]["surprise"] = "boom"
    body = {"items": data["items"], "itemOrder": data["itemOrder"]}
    response = Client().post(LIST_URL, data=body, content_type="application/json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_get_returns_full_scene_with_typed_items():
    scene = SceneFactory.create()
    out = Client().get(_detail(scene.key)).json()
    assert {
        "items",
        "itemOrder",
        "title",
        "key",
        "author",
        "createdDate",
        "modifiedDate",
        "archived",
        "isLegacy",
    } <= set(out.keys())
    assert out["items"][0]["type"] == "FOLDER"


@pytest.mark.django_db
def test_get_increments_and_persists_times_accessed():
    scene = SceneFactory.create()
    assert scene.times_accessed == 0
    Client().get(_detail(scene.key))
    scene.refresh_from_db()
    assert scene.times_accessed == 1


@pytest.mark.django_db
def test_get_does_not_bump_modified_date():
    scene = SceneFactory.create()
    before = scene.modified_date
    Client().get(_detail(scene.key))
    scene.refresh_from_db()
    assert scene.modified_date == before  # .update() counter, not save()


@pytest.mark.django_db
def test_get_archived_scene_is_returned():
    scene = SceneFactory.create(archived=True)
    assert Client().get(_detail(scene.key)).status_code == 200


@pytest.mark.django_db
def test_get_legacy_key_migrates_then_returns_scene():
    legacy = LegacyScene.objects.create(
        dehydrated={
            "folders": {},
            "mathSymbols": {},
            "mathGraphics": {},
            "sliderValues": {},
            "sortableTree": {"root": []},
            "metadata": {"creationDate": '"2020-01-01T00:00:00Z"', "title": "Old"},
        }
    )
    response = Client().get(_detail(legacy.key))
    assert response.status_code == 200
    assert response.json()["isLegacy"] is True


@pytest.mark.django_db
def test_patch_author_can_update_title():
    me = CustomUserFactory.create()
    scene = SceneFactory.create(author=me)
    client = Client()
    client.force_login(me)
    out = client.patch(
        _detail(scene.key), data={"title": "Renamed"}, content_type="application/json"
    ).json()
    assert out["title"] == "Renamed"


@pytest.mark.django_db
def test_patch_updates_item_order_only():
    # Pins that the camelCase-aliased `itemOrder` field round-trips through
    # populate_by_name + exclude_unset (the handler keys off the snake_case
    # field name `item_order`).
    me = CustomUserFactory.create()
    scene = SceneFactory.create(author=me)
    client = Client()
    client.force_login(me)
    new_order = {"main": ["a", "b"], "a": [], "b": []}
    out = client.patch(
        _detail(scene.key),
        data={"itemOrder": new_order},
        content_type="application/json",
    ).json()
    assert out["itemOrder"] == new_order
    scene.refresh_from_db()
    assert scene.item_order == new_order


@pytest.mark.django_db
def test_patch_anonymous_gets_403():
    scene = SceneFactory.create(author=CustomUserFactory.create())
    response = Client().patch(
        _detail(scene.key), data={"title": "x"}, content_type="application/json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_patch_non_author_gets_403_with_well_formed_body():
    # Well-formed body so the handler's ownership check is what fires (D11).
    scene = SceneFactory.create(author=CustomUserFactory.create())
    other = CustomUserFactory.create()
    client = Client()
    client.force_login(other)
    response = client.patch(
        _detail(scene.key), data={"title": "x"}, content_type="application/json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_anonymous_gets_403():
    scene = SceneFactory.create(author=CustomUserFactory.create())
    assert Client().delete(_detail(scene.key)).status_code == 403


@pytest.mark.django_db
def test_delete_author_gets_204():
    me = CustomUserFactory.create()
    scene = SceneFactory.create(author=me)
    client = Client()
    client.force_login(me)
    assert client.delete(_detail(scene.key)).status_code == 204
    assert not Scene.objects.filter(key=scene.key).exists()
