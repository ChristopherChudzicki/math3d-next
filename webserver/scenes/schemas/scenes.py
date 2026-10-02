from datetime import datetime
from typing import Annotated, Any, Dict, List, Optional
from urllib.parse import quote, urlencode

from django.conf import settings
from ninja import Field, FilterLookup, FilterSchema, Schema
from pydantic import ConfigDict

from scenes.schemas.math_items import MathItem


def scene_image_url(key: str, modified_date: datetime) -> Optional[str]:
    """The scene's screenshot URL on the render Worker (packages/screenshots),
    or None when the feature is dark.

    Tentative: nothing records whether a render landed. ``fallback=none`` makes
    a miss 404 instead of serving the default OG card, so an <img> can fall back
    to its own placeholder. ``v`` busts the browser cache after an edit."""
    if not settings.SCREENSHOTS_ORIGIN:
        return None
    query = urlencode({"fallback": "none", "v": modified_date.isoformat()})
    return (
        f"{settings.SCREENSHOTS_ORIGIN}/screenshots/scene/{quote(key, safe='')}.png"
        f"?{query}"
    )


class _AuthoredSceneSchema(Schema):
    """Shared config + author resolver for the scene output schemas
    (`author` is the FK's id, resolved off `author_id`)."""

    model_config = ConfigDict(populate_by_name=True)

    @staticmethod
    def resolve_author(obj) -> Optional[int]:
        return obj.author_id


class MiniSceneSchema(_AuthoredSceneSchema):
    title: Optional[str] = None
    key: str
    author: Optional[int] = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool
    image_url: Optional[str] = Field(alias="imageUrl")

    @staticmethod
    def resolve_image_url(obj) -> Optional[str]:
        return scene_image_url(obj.key, obj.modified_date)


class SceneMetaSchema(Schema):
    """Title-only shape for the read-only meta endpoint the edge OG Worker calls."""

    title: Optional[str] = None


class SceneSchema(_AuthoredSceneSchema):
    items: List[MathItem]
    item_order: Dict[str, List[str]] = Field(alias="itemOrder")
    title: Optional[str] = None
    key: str
    author: Optional[int] = None
    created_date: datetime = Field(alias="createdDate")
    modified_date: datetime = Field(alias="modifiedDate")
    archived: bool
    is_legacy: bool = Field(alias="isLegacy")


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
    # defaults rather than `Optional[...] = None`. This is deliberate for
    # strictness: a non-nullable field rejects an explicit `items: null` (or
    # `itemOrder: null`) in the body with a 422 instead of silently no-op'ing.
    # (Historically this also dodged an openapi-generator-cli v7.2.0 bug that
    # degraded the `anyOf: [<array-of-$ref>, null]` union to `null` in the
    # client; v7.23.0 resolves that union correctly, so only the strictness
    # rationale remains.)
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
