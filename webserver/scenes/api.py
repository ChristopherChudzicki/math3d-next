from typing import List

from django.db.models import F
from django.shortcuts import get_object_or_404
from ninja import Query, Router, Status
from ninja.errors import HttpError
from ninja.pagination import LimitOffsetPagination, paginate

from main.ninja_auth import session_auth
from scenes.legacy_scene_utils.migrate_scene import migrate_scene
from scenes.models import LegacyScene, Scene
from scenes.schemas import (
    LegacySceneInSchema,
    LegacySceneOutSchema,
    MiniSceneSchema,
    SceneCreateSchema,
    SceneFilterSchema,
    ScenePatchSchema,
    SceneSchema,
)

scenes_router = Router()


@scenes_router.get("/", response=List[MiniSceneSchema], auth=None, by_alias=True)
@paginate(LimitOffsetPagination)
def list_scenes(request, filters: SceneFilterSchema = Query(...)):
    return filters.filter(Scene.objects.all())


@scenes_router.get(
    "/me/", response=List[MiniSceneSchema], auth=session_auth, by_alias=True
)
@paginate(LimitOffsetPagination)
def my_scenes(request, filters: SceneFilterSchema = Query(...)):
    return filters.filter(Scene.objects.filter(author_id=request.user.id))


@scenes_router.post("/", response={201: SceneSchema}, auth=None, by_alias=True)
def create_scene(request, payload: SceneCreateSchema):
    author = request.user if request.user.is_authenticated else None
    scene = Scene(
        items=[item.model_dump(mode="json") for item in payload.items],
        item_order=payload.item_order,
        archived=payload.archived,
        author=author,
    )
    if payload.title is not None:
        scene.title = payload.title
    scene.save()  # full_clean() re-validates items (defense in depth)
    return Status(201, scene)


@scenes_router.get("/{key}/", response=SceneSchema, auth=None, by_alias=True)
def get_scene(request, key: str):
    if LegacyScene.objects.filter(key=key).exists():
        # v0 parity: re-migrate on every legacy-key GET. The .update() below then
        # stacks on the count migrate_scene carries over — harmless for a view counter.
        legacy = LegacyScene.objects.get(key=key)
        legacy.times_accessed += 1
        legacy.save()
        migrate_scene(legacy)

    scene = get_object_or_404(Scene, key=key)
    # Atomic counter that skips Scene.save()'s full_clean() and modified_date
    # bump (viewing is not modifying); fixes the v0 no-save bug.
    Scene.objects.filter(pk=scene.pk).update(times_accessed=F("times_accessed") + 1)
    scene.times_accessed += 1  # reflect on the in-memory instance for the response
    return scene


@scenes_router.patch("/{key}/", response=SceneSchema, auth=session_auth, by_alias=True)
def update_scene(request, key: str, payload: ScenePatchSchema):
    scene = get_object_or_404(Scene, key=key)
    if scene.author_id != request.user.id:
        raise HttpError(403, "You do not have permission to modify this scene.")
    data = payload.dict(exclude_unset=True)
    if "items" in data:
        scene.items = [item.model_dump(mode="json") for item in payload.items]
    if "item_order" in data:
        scene.item_order = data["item_order"]
    if "title" in data:
        scene.title = data["title"]
    if "archived" in data:
        scene.archived = data["archived"]
    scene.save()
    return scene


@scenes_router.delete("/{key}/", response={204: None}, auth=session_auth)
def delete_scene(request, key: str):
    scene = get_object_or_404(Scene, key=key)
    if scene.author_id != request.user.id:
        raise HttpError(403, "You do not have permission to delete this scene.")
    scene.delete()
    return Status(204, None)  # matches authentication/api.py's Status(204, None)


legacy_router = Router()


@legacy_router.post("/", response={201: LegacySceneOutSchema}, auth=None)
def create_legacy(request, payload: LegacySceneInSchema):
    scene = LegacyScene.objects.create(dehydrated=payload.dehydrated)
    return Status(201, scene)


@legacy_router.get("/{key}/", response=LegacySceneOutSchema, auth=None)
def get_legacy(request, key: str):
    scene = get_object_or_404(LegacyScene, key=key)
    scene.times_accessed += 1
    scene.save()
    return scene
