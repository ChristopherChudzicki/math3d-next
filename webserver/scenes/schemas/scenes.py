from datetime import datetime
from typing import Annotated, Any

from ninja import Field, FilterLookup, FilterSchema, Schema
from pydantic import ConfigDict

from scenes.schemas.math_items import MathItem


class _AuthoredSceneSchema(Schema):
    """Shared config + author resolver for the scene output schemas
    (`author` is the FK's id, resolved off `author_id`)."""

    model_config = ConfigDict(populate_by_name=True)

    @staticmethod
    def resolve_author(obj) -> int | None:
        return obj.author_id


class MiniSceneSchema(_AuthoredSceneSchema):
    title: str | None = None
    key: str
    author: int | None = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool


class SceneMetaSchema(Schema):
    """Title-only shape for the read-only meta endpoint the edge OG Worker calls."""

    title: str | None = None


class SceneSchema(_AuthoredSceneSchema):
    items: list[MathItem]
    item_order: dict[str, list[str]] = Field(alias="itemOrder")
    title: str | None = None
    key: str
    author: int | None = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool
    is_legacy: bool = Field(alias="isLegacy")


class SceneCreateSchema(Schema):
    # populate_by_name + aliases so the endpoint accepts camelCase request bodies.
    model_config = ConfigDict(populate_by_name=True)

    items: list[MathItem]
    item_order: dict[str, list[str]] = Field(alias="itemOrder")
    title: str | None = None
    archived: bool = False


class ScenePatchSchema(Schema):
    # Partial-update schema (NOT ninja.PatchDict). Presence is detected via
    # `exclude_unset` in the handler, so `items`/`item_order` use non-nullable
    # defaults rather than `Optional[...] = None`. This is deliberate for
    # strictness: a non-nullable field rejects an explicit `items: null` (or
    # `itemOrder: null`) in the body with a 422 instead of silently no-op'ing.
    # (Historically this also dodged an openapi-generator-cli v7.2.0 bug that
    # degraded the `anyOf: [<array-of-$ref>, null]` union to `null` in the
    # client; v7.23.0 resolves that union correctly, so only the strictness
    # rationale remains.)
    model_config = ConfigDict(populate_by_name=True)

    items: list[MathItem] = Field(default_factory=list)
    item_order: dict[str, list[str]] = Field(default_factory=dict, alias="itemOrder")
    title: str | None = None
    archived: bool | None = None


class SceneFilterSchema(FilterSchema):
    title: Annotated[str | None, FilterLookup("title__icontains")] = None
    archived: bool | None = None  # exact; ignore_none default skips when absent


class LegacySceneInSchema(Schema):
    dehydrated: Any


class LegacySceneOutSchema(Schema):
    key: str
    dehydrated: Any
