from datetime import datetime
from typing import List, Optional

from ninja import Field, FilterSchema, Query, Router, Schema
from pydantic import ConfigDict
from ninja.pagination import LimitOffsetPagination, paginate

from main.ninja_auth import session_auth
from scenes.models import Scene

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
    # NOTE: Field(q=...) is the deprecated-but-functional form in ninja 1.6.2
    # (emits a DeprecationWarning; no `-W error` in pyproject.toml, so it's benign).
    title: Optional[str] = Field(default=None, q="title__icontains")  # type: ignore[call-overload]
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
