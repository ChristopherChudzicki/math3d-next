from datetime import datetime
from typing import Annotated, Any, Dict, List, Optional

from ninja import Field, FilterLookup, FilterSchema, Schema
from pydantic import ConfigDict

from scenes.schemas.math_items import MathItem


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
        return obj.author_id


class SceneSchema(Schema):
    model_config = ConfigDict(populate_by_name=True)

    items: List[MathItem]
    item_order: Dict[str, List[str]] = Field(alias="itemOrder")
    title: Optional[str] = None
    key: str
    author: Optional[int] = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool
    is_legacy: bool = Field(alias="isLegacy")

    @staticmethod
    def resolve_author(obj) -> Optional[int]:
        return obj.author_id


class SceneCreateSchema(Schema):
    # populate_by_name + aliases so the endpoint accepts camelCase request bodies.
    model_config = ConfigDict(populate_by_name=True)

    items: List[MathItem]
    item_order: Dict[str, List[str]] = Field(alias="itemOrder")
    title: Optional[str] = None
    archived: bool = False


class ScenePatchSchema(Schema):
    # All-Optional partial schema (NOT ninja.PatchDict); a present `items` list
    # is still union-validated at the Ninja layer.
    model_config = ConfigDict(populate_by_name=True)

    items: Optional[List[MathItem]] = None
    item_order: Optional[Dict[str, List[str]]] = Field(default=None, alias="itemOrder")
    title: Optional[str] = None
    archived: Optional[bool] = None


class SceneFilterSchema(FilterSchema):
    title: Annotated[Optional[str], FilterLookup("title__icontains")] = None
    archived: Optional[bool] = None  # exact; ignore_none default skips when absent


class LegacySceneInSchema(Schema):
    dehydrated: Any


class LegacySceneOutSchema(Schema):
    key: str
    dehydrated: Any
