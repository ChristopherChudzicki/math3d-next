from scenes.management.commands.audit_legacy_migration import (
    hidden_by_blank_visibility,
)


def test_hidden_by_blank_visibility_lists_hidden_items_with_a_blank_expression():
    shown = {"useCalculatedVisibility": True, "calculatedVisibility": "\\ "}
    rehydrated = {
        "mathGraphics": {
            "hidden": {**shown, "visible": False},
            "visible": {**shown, "visible": True},
            "has-expr": {**shown, "visible": False, "calculatedVisibility": "a"},
            "calc-off": {**shown, "visible": False, "useCalculatedVisibility": False},
        }
    }
    assert hidden_by_blank_visibility(rehydrated) == ["hidden"]


def test_hidden_by_blank_visibility_tolerates_a_scene_without_graphics():
    assert hidden_by_blank_visibility({}) == []
