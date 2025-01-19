from scenes.legacy_scene_utils.translate import ItemMigrator
from scenes.models import Scene, LegacyScene

from scenes.legacy_scene_utils.default_data import set_defaults


def migrate_scene(legacy_scene: LegacyScene):
    set_defaults(legacy_scene)
    migrator = ItemMigrator()

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

    items = []
    for item_id, item in old_items.items():
        items.append(migrator.translate_item(item, item_id).to_json_data())

    item_order = legacy_scene.dehydrated["sortableTree"]
    item_order["main"] = item_order["root"]
    del item_order["root"]

    scene, _created = Scene.objects.update_or_create(
        key=legacy_scene.key,
        defaults={
            "items": items,
            "item_order": legacy_scene.dehydrated["sortableTree"],
            "title": legacy_scene.dehydrated["metadata"].get("title", "Untitled"),
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
