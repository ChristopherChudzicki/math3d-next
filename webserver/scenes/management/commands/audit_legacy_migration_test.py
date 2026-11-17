from scenes.management.commands.audit_legacy_migration import (
    overridden_by_blank_visibility,
)


def test_overridden_by_blank_visibility_lists_items_a_fresh_load_draws_differently():
    blank = {"useCalculatedVisibility": True, "calculatedVisibility": "\\ "}
    rehydrated = {
        "mathGraphics": {
            "hidden": {**blank, "visible": False},
            "shown": {**blank, "visible": True},
            "grid-yz": {**blank, "visible": True},
            "has-expr": {**blank, "visible": False, "calculatedVisibility": "a"},
            "calc-off": {**blank, "visible": False, "useCalculatedVisibility": False},
            "camera": {**blank, "type": "CAMERA"},
        }
    }
    assert overridden_by_blank_visibility(rehydrated) == [
        "hidden",
        "grid-yz",
    ]


def test_overridden_by_blank_visibility_tolerates_a_scene_without_graphics():
    assert overridden_by_blank_visibility({}) == []
