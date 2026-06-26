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
    # Partial-update schema (NOT ninja.PatchDict). Presence is detected via
    # `exclude_unset` in the handler, so `items`/`item_order` use non-nullable
    # defaults rather than `Optional[...] = None`. This is deliberate: an
    # `Optional[List[MathItem]]` emits `anyOf: [<array-of-oneOf>, null]`, and
    # openapi-generator-cli v7.2.0 (typescript-axios) can't resolve the inline
    # `oneOf` nested inside that `anyOf` and degrades the field to `null` in the
    # client. A bare `List[MathItem]` default emits the same plain
    # array-of-oneOf as the POST body, so the generated `ScenePatchSchema.items`
    # reuses the real `SceneCreateSchemaItemsInner` union. Side effect: an
    # explicit `items: null` (or `itemOrder: null`) in the body now 422s instead
    # of silently no-op'ing, which is the desired strictness.
    model_config = ConfigDict(populate_by_name=True)

    items: List[MathItem] = Field(default_factory=list)
    item_order: Dict[str, List[str]] = Field(default_factory=dict, alias="itemOrder")
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
