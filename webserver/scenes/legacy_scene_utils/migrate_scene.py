import copy
import logging
import re
from dataclasses import dataclass
from typing import Any

from django.core.exceptions import ValidationError

from scenes.legacy_scene_utils.default_data import set_defaults
from scenes.legacy_scene_utils.issue_log import Issue
from scenes.legacy_scene_utils.translate import ItemMigrator
from scenes.models import LegacyScene, Scene, is_invalid_key_error

logger = logging.getLogger(__name__)


def parse_value(value: str, default: float) -> float:
    """
    Parse a legacy axis scale: a number, "a/b", or "\\frac{a}{b}" (LaTeX spaces
    allowed). Anything else, e.g. a variable, falls back to the default.
    """
    value = value.replace("\\ ", "").strip()
    frac = re.fullmatch(r"\\frac\{(.+)\}\{(.+)\}", value)
    if frac:
        value = f"{frac[1]}/{frac[2]}"
    try:
        if "/" in value:
            numerator, denominator = value.split("/")
            return float(numerator) / float(denominator)
        return float(value)
    except (ValueError, ZeroDivisionError):
        # If the value cannot be parsed, return the default value
        return default


def get_axis_scales(old_items: dict) -> tuple[float, float, float]:
    """Get the axis scales from the legacy axis items (flat dicts)."""
    return (
        parse_value(str(old_items["axis-x"].get("scale", "1")), 1),
        parse_value(str(old_items["axis-y"].get("scale", "1")), 1),
        parse_value(str(old_items["axis-z"].get("scale", "1/2")), 0.5),
    )


def _legacy_title(metadata: dict) -> str:
    """Legacy titles may span lines and store "Untitled"; Scene titles are
    single-line, and blank means untitled."""
    title = re.sub(r"\r\n|[\r\n]", " ", metadata.get("title", "")).strip()
    return "" if title == "Untitled" else title


@dataclass
class TranslatedScene:
    items: list[dict]
    item_order: dict[str, list[str]]
    title: str
    creation_date: str | None
    issues: list[Issue]


def translate_legacy_scene(dehydrated: dict) -> TranslatedScene:
    """Translate a legacy scene's dehydrated blob without touching the database."""
    dehydrated = copy.deepcopy(dehydrated)
    set_defaults(dehydrated)

    for item_id, item in dehydrated["folders"].items():
        item["type"] = "FOLDER"

    # math3d-react's initialState items. A saved built-in item is only its diff
    # against these, so they are merged per property below.
    default_items: dict[str, dict[str, Any]] = {
        "camera": {"type": "CAMERA"},
        "axis-x": {"type": "AXIS", "axis": "x"},
        "axis-y": {"type": "AXIS", "axis": "y"},
        "axis-z": {"type": "AXIS", "axis": "z", "scale": "1/2"},
        "grid-xy": {"type": "GRID", "axes": "xy"},
        "grid-yz": {"type": "GRID", "axes": "yz", "visible": False},
        "grid-zx": {"type": "GRID", "axes": "zx", "visible": False},
    }

    symbols = dehydrated["mathSymbols"]
    for item_id, item in symbols.items():
        if item["type"] == "VARIABLE_SLIDER" and "value" not in item:
            item["value"] = dehydrated["sliderValues"][item_id]

    old_items = {
        **default_items,
        **dehydrated["folders"],
        **dehydrated["mathGraphics"],
        **dehydrated["mathSymbols"],
    }
    for item_id, defaults in default_items.items():
        old_items[item_id] = {**defaults, **old_items[item_id]}

    axis_scales = get_axis_scales(old_items)

    migrator = ItemMigrator(
        x_scale=axis_scales[0],
        y_scale=axis_scales[1],
        z_scale=axis_scales[2],
    )
    items = []
    for item_id, item in old_items.items():
        items.append(migrator.translate_item(item, item_id).model_dump(mode="json"))

    item_order = dehydrated["sortableTree"]
    item_order["main"] = item_order["root"]
    del item_order["root"]

    # In mathbox-react, if a folder has 100% default settings, the item won't
    # even exist in the dehydrated folder data, only in item_order.
    for folder_id in item_order["main"]:
        if folder_id not in {item["id"] for item in items}:
            items.append(
                migrator.translate_item(
                    {
                        "type": "FOLDER",
                    },
                    folder_id,
                ).model_dump(mode="json")
            )

    # Mathbox-react can have orphaned folders in the item_order that don't
    # exist in the main tree. This seems to happen if you add then delete a
    # folder. Let's remove them.
    for folder_id in list(item_order):
        if not item_order[folder_id] and folder_id not in item_order["main"]:
            del item_order[folder_id]

    metadata = dehydrated["metadata"]
    creation_date = metadata.get("creationDate")
    return TranslatedScene(
        items=items,
        item_order=item_order,
        title=_legacy_title(metadata),
        creation_date=None if creation_date is None else creation_date.replace('"', ""),
        issues=migrator.log.issues(),
    )


def migrate_scene(legacy_scene: LegacyScene) -> TranslatedScene | None:
    translated = translate_legacy_scene(legacy_scene.dehydrated)
    try:
        scene, _created = Scene.objects.update_or_create(
            key=legacy_scene.key,
            defaults={
                "items": translated.items,
                "item_order": translated.item_order,
                "title": translated.title,
                "times_accessed": legacy_scene.times_accessed,
                "is_legacy": True,
            },
        )
    except ValidationError as e:
        if not is_invalid_key_error(e):
            # Invalid items (or any non-key validation failure) keep the old
            # loud-failure contract — don't mislabel them as an invalid key.
            raise
        logger.warning(
            "Skipping migration of legacy scene with invalid key %r", legacy_scene.key
        )
        return None
    # TimestampedModel.save() overwrites modified_date on every write (and
    # created_date on insert), so backdate with a queryset update.
    if translated.creation_date is None:
        raise KeyError("creationDate")
    Scene.objects.filter(pk=scene.id).update(
        created_date=translated.creation_date,
        modified_date=translated.creation_date,
        content_modified_date=translated.creation_date,
    )

    legacy_scene.migration_note = "\n".join(
        f"{issue.severity.name} {issue.message}" for issue in translated.issues
    )
    legacy_scene.save(update_fields=["migration_note"])
    return translated
