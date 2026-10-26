import copy
import logging
import math
import re
from dataclasses import dataclass
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from scenes.legacy_scene_utils.default_data import set_defaults
from scenes.legacy_scene_utils.indexing import shift_indices
from scenes.legacy_scene_utils.issue_log import Issue, IssueLog
from scenes.legacy_scene_utils.translate import ItemMigrator, blank_to_empty
from scenes.models import LegacyScene, Scene, is_invalid_key_error

logger = logging.getLogger(__name__)


def parse_value(value: str, default: float) -> float:
    """
    Parse a legacy axis scale: a number, "a/b", or "\\frac{a}{b}" (either may
    be negated; LaTeX spaces allowed). Anything else, e.g. a variable, falls
    back to the default.
    """
    value = value.replace("\\ ", "").strip()
    sign = 1.0
    if value.startswith("-\\frac"):
        sign, value = -1.0, value[1:]
    frac = re.fullmatch(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", value)
    if frac:
        value = f"{frac[1]}/{frac[2]}"
    try:
        if "/" in value:
            numerator, denominator = value.split("/")
            result = float(numerator) / float(denominator)
        else:
            result = float(value)
    except (ValueError, ZeroDivisionError):
        return default
    return sign * result if math.isfinite(result) else default


AxisScale = float | str


def get_axis_scales(
    old_items: dict, log: IssueLog
) -> tuple[AxisScale, AxisScale, AxisScale]:
    """Get the axis scales from the legacy axis items (flat dicts). A scale
    that isn't a plain number stays an expression for math3d-next to evaluate,
    as it does the axis's own. A negative scale mirrors its axis in both apps
    and is kept. A blank one is 1.0, math3d-next's fallback for a scale it
    can't evaluate (useAxesInfo.tsx); zero falls back to the default, with a
    warning."""
    scales: list[AxisScale] = []
    for axis_id, default_text, default in (
        ("axis-x", "1", 1.0),
        ("axis-y", "1", 1.0),
        ("axis-z", "1/2", 0.5),
    ):
        raw = str(old_items[axis_id].get("scale", default_text))
        value = parse_value(raw, math.nan)
        if value == 0:
            log.set_prefix(axis_id)
            log.warning(f"Camera uses scale {default}; can't use axis scale {raw!r}")
            scales.append(default)
        elif not math.isnan(value):
            scales.append(value)
        elif not blank_to_empty(raw):
            scales.append(1.0)
        else:
            scales.append(shift_indices(raw)[0])
    return scales[0], scales[1], scales[2]


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

    log = IssueLog()
    axis_scales = get_axis_scales(old_items, log)

    migrator = ItemMigrator(
        log=log,
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
    if translated.creation_date is None:
        raise KeyError("creationDate")
    with transaction.atomic():
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
                "Skipping migration of legacy scene with invalid key %r",
                legacy_scene.key,
            )
            return None
        # TimestampedModel.save() overwrites modified_date on every write (and
        # created_date on insert), so backdate with a queryset update.
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
