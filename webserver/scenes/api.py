from datetime import datetime
from typing import Annotated, Any, List, Optional

from django.shortcuts import get_object_or_404
from ninja import Field, FilterSchema, FilterLookup, Query, Router, Schema, Status
from ninja.pagination import LimitOffsetPagination, paginate
from pydantic import ConfigDict

from main.ninja_auth import session_auth
from scenes.models import LegacyScene, Scene

scenes_router = Router()


class MiniSceneSchema(Schema):
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = None
    key: str
    author: Optional[int] = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool

    @staticmethod
    def resolve_author(obj) -> Optional[int]:
        # Required: from_attributes would otherwise read obj.author (a CustomUser
        # instance) and fail int validation. v0 emits the id via SlugRelatedField.
        return obj.author_id


class SceneFilterSchema(FilterSchema):
    title: Annotated[Optional[str], FilterLookup("title__icontains")] = None
    archived: Optional[bool] = (
        None  # exact match; ignore_none default skips when absent
    )


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


legacy_router = Router()


class LegacySceneInSchema(Schema):
    dehydrated: Any


class LegacySceneOutSchema(Schema):
    key: str
    dehydrated: Any


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
