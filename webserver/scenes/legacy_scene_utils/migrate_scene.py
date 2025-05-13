from typing import Annotated
from scenes.legacy_scene_utils.translate import ItemMigrator
from scenes.models import Scene, LegacyScene

from scenes.legacy_scene_utils.default_data import set_defaults


def parse_value(value: str, default: float) -> float:
    """
    Parse a value from a string to a float. The value can be a fraction or a
    decimal number.
    """
    try:
        if "/" in value:
            numerator, denominator = value.split("/")
            return float(numerator) / float(denominator)
        return float(value)
    except ValueError:
        # If the value cannot be parsed, return the default value
        return default


def get_axis_scales(old_items: dict) -> Annotated[list[float], 3]:
    """
    Get the axis scales from the old items. The axis scales are stored in the
    properties of the axis items.
    """
    x_scale = y_scale = z_scale = 1.0
    for item_id, item in old_items.items():
        if item_id == "axis-x":
            x_scale = parse_value(item.get("properties", {}).get("scale", "1"), 1)
        elif item_id == "axis-y":
            y_scale = parse_value(item.get("properties", {}).get("scale", "1"), 1)
        elif item_id == "axis-z":
            z_scale = parse_value(item.get("properties", {}).get("scale", "1/2"), 0.5)

    return [x_scale, y_scale, z_scale]


def migrate_scene(legacy_scene: LegacyScene):
    set_defaults(legacy_scene)

    for item_id, item in legacy_scene.dehydrated["folders"].items():
        item["type"] = "FOLDER"

    default_items = {
        "axis-x": {"type": "AXIS", "axis": "x"},
        "axis-y": {"type": "AXIS", "axis": "y"},
        "axis-z": {"type": "AXIS", "axis": "z", "scale": "1/2"},
        "grid-xy": {"type": "GRID", "axes": "xy"},
        "grid-yz": {"type": "GRID", "axes": "yz", "visible": False},
        "grid-zx": {"type": "GRID", "axes": "zx", "visible": False},
    }

    symbols = legacy_scene.dehydrated["mathSymbols"]
    for item_id, item in symbols.items():
        if item["type"] == "VARIABLE_SLIDER" and "value" not in item:
            item["value"] = legacy_scene.dehydrated["sliderValues"][item_id]

    old_items = {
        **default_items,
        **legacy_scene.dehydrated["folders"],
        **legacy_scene.dehydrated["mathGraphics"],
        **legacy_scene.dehydrated["mathSymbols"],
    }

    axis_scales = get_axis_scales(old_items)

    migrator = ItemMigrator(
        x_scale=axis_scales[0],
        y_scale=axis_scales[1],
        z_scale=axis_scales[2],
    )
    items = []
    for item_id, item in old_items.items():
        items.append(migrator.translate_item(item, item_id).to_json_data())

    item_order = legacy_scene.dehydrated["sortableTree"]
    item_order["main"] = item_order["root"]
    del item_order["root"]

    # In mathbox-react, if a folder has 100% default settings, the item won't
    # even exist in the dehydrated folder data, only in item_order.
    for folder_id in item_order["main"]:
        if folder_id not in set(item["id"] for item in items):
            items.append(
                migrator.translate_item(
                    {
                        "type": "FOLDER",
                    },
                    folder_id,
                ).to_json_data()
            )

    # Mathbox-react can have orphaned folders in the item_order that don't
    # exist in the main tree. This seems to happen if you add then delete a
    # folder. Let's remove them.
    for folder_id in list(item_order):
        if not item_order[folder_id] and folder_id not in item_order["main"]:
            del item_order[folder_id]

    scene, _created = Scene.objects.update_or_create(
        key=legacy_scene.key,
        defaults={
            "items": items,
            "item_order": legacy_scene.dehydrated["sortableTree"],
            "title": legacy_scene.dehydrated["metadata"].get("title", "Untitled"),
            "times_accessed": legacy_scene.times_accessed,
        },
    )
    # These are auto_now_add, auto_now columns and can't be modified
    # in save()
    Scene.objects.filter(pk=scene.id).update(
        created_date=legacy_scene.dehydrated["metadata"]["creationDate"].replace(
            '"', ""
        ),
        modified_date=legacy_scene.dehydrated["metadata"]["creationDate"].replace(
            '"', ""
        ),
    )

    legacy_scene.migration_note = "\n".join(
        (issue.message for issue in migrator.log.issues())
    )
    legacy_scene.save(update_fields=["migration_note"])
