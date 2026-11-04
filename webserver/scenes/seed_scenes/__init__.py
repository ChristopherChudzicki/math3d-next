"""Scenes committed as JSON in this directory and loaded by key.

Format and workflow: ``README.md`` beside this file.
"""

import json
from collections import Counter
from pathlib import Path
from typing import Literal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from ninja import Field, Schema
from pydantic import ConfigDict, field_validator

from scenes.models import SCENE_KEY_VALIDATOR, ExampleScene, Scene
from scenes.schemas.math_items import MathItem
from scenes.schemas.scenes import SceneTitle
from scenes.screenshots import schedule_render

SEED_DIR = Path(__file__).parent
SEED_SUBDIRS = ("qa", "examples")

LoadStatus = Literal["created", "updated", "unchanged"]


class ExampleRef(Schema):
    model_config = ConfigDict(extra="forbid")

    # The bounds are PositiveSmallIntegerField's.
    position: int = Field(ge=0, le=32767)


class SeedScene(Schema):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    # Field order is the file's key order, so a dump diffs cleanly against it.
    key: str
    title: SceneTitle
    items: list[MathItem]
    item_order: dict[str, list[str]] = Field(alias="itemOrder")
    example: ExampleRef | None = None

    @field_validator("key")
    @classmethod
    def _valid_key(cls, key: str) -> str:
        try:
            SCENE_KEY_VALIDATOR(key)
        except ValidationError as error:
            raise ValueError("; ".join(error.messages)) from error
        return key


class SeedSceneError(Exception):
    def __init__(self, path: Path, message: str):
        super().__init__(f"{path}: {message}")
        self.path = path


def seed_scene_paths() -> list[Path]:
    return [
        path
        for subdir in SEED_SUBDIRS
        for path in sorted((SEED_DIR / subdir).glob("*.json"))
    ]


def read_seed_scene(path: Path) -> SeedScene:
    try:
        return SeedScene.model_validate(json.loads(path.read_text()))
    except (OSError, ValueError) as error:
        raise SeedSceneError(path, str(error)) from error


def dump_seed_scene(scene: Scene) -> dict:
    """The seed file's contents for ``scene``."""
    position = _example_position(scene)
    seed = SeedScene(
        key=scene.key,
        title=scene.title,
        items=scene.items,
        itemOrder=scene.item_order,
        example=None if position is None else ExampleRef(position=position),
    )
    return seed.model_dump(
        mode="json", by_alias=True, exclude={"example"} if position is None else None
    )


def load_seed_scenes(seeds: list[SeedScene]) -> list[tuple[Scene, LoadStatus]]:
    """Upsert every seed by key, all in one transaction.

    Seed scenes have no author, so a row that has one is someone's scene that
    happens to share the key: refuse rather than overwrite it. A legacy scene
    under the key is taken over: the file becomes its content and it stops
    being legacy, so ``get_scene`` no longer re-translates it.
    """
    _check_unique(seeds)
    with transaction.atomic():
        loaded = [_load_scene(seed) for seed in seeds]
        _place_examples(
            [(scene, seed.example) for seed, (scene, _) in zip(seeds, loaded)]
        )
    return loaded


def _check_unique(seeds: list[SeedScene]) -> None:
    keys = Counter(seed.key for seed in seeds)
    positions = Counter(seed.example.position for seed in seeds if seed.example)
    for name, counts in (("key", keys), ("example position", positions)):
        duplicated = sorted(str(value) for value, n in counts.items() if n > 1)
        if duplicated:
            raise ValidationError(
                f"Seeds share the {name} {', '.join(duplicated)}; keys and "
                "positions must be unique across seeds."
            )


def _example_position(scene: Scene) -> int | None:
    return (
        ExampleScene.objects.filter(scene=scene)
        .values_list("position", flat=True)
        .first()
    )


def _load_scene(seed: SeedScene) -> tuple[Scene, LoadStatus]:
    items = [item.model_dump(mode="json") for item in seed.items]
    scene = Scene.objects.filter(key=seed.key).first()
    if scene is None:
        scene = Scene(
            key=seed.key,
            title=seed.title,
            items=items,
            item_order=seed.item_order,
        )
        scene.save()
        schedule_render(scene)
        return scene, "created"
    if scene.author_id is not None:
        raise ValidationError(
            f"Scene {seed.key!r} belongs to a user; not overwriting it."
        )
    content_changed = (scene.items, scene.item_order) != (items, seed.item_order)
    position = None if seed.example is None else seed.example.position
    if (
        not content_changed
        and not scene.is_legacy
        and scene.title == seed.title
        and _example_position(scene) == position
    ):
        return scene, "unchanged"
    scene.title = seed.title
    scene.items = items
    scene.item_order = seed.item_order
    scene.is_legacy = False
    if content_changed:
        # screenshot_version derives from this date; as in update_scene, only
        # a content change moves it.
        scene.content_modified_date = timezone.now()
    scene.save()
    if content_changed:
        schedule_render(scene)
    return scene, "updated"


def _place_examples(placements: list[tuple[Scene, ExampleRef | None]]) -> None:
    scenes = [scene for scene, _ in placements]
    wanted = {ref.position: scene for scene, ref in placements if ref is not None}
    taken = (
        ExampleScene.objects.filter(position__in=wanted)
        .exclude(scene__in=scenes)
        .select_related("scene")
    )
    for example in taken:
        raise ValidationError(
            f"Example position {example.position} is held by scene "
            f"{example.scene.key!r}, which has no seed file; move or remove it "
            "in the admin."
        )
    # position is unique and not deferrable, so writing a swap row by row fails
    # midway; delete and recreate the rows of every scene in this batch instead.
    ExampleScene.objects.filter(scene__in=scenes).delete()
    ExampleScene.objects.bulk_create(
        ExampleScene(scene=scene, position=position)
        for position, scene in wanted.items()
    )
