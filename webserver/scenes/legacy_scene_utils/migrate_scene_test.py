import pytest

from scenes.legacy_scene_utils.migrate_scene import (
    parse_value,
    translate_legacy_scene,
)


def _dehydrated(graphics=None, folders=None):
    return {
        "metadata": {"title": "t", "creationDate": '"2020-01-01T00:00:00Z"'},
        "sortableTree": {"root": ["main"], "main": []},
        "folders": folders or {},
        "mathGraphics": graphics or {},
        "mathSymbols": {},
        "sliderValues": {},
    }


def _items(translated):
    return {item["id"]: item["properties"] for item in translated.items}


def test_customized_default_grid_keeps_its_axes_and_visibility():
    # math3d-react saves a built-in item as a diff against its initial state,
    # so a recolored yz grid is stored without `axes` or `visible`.
    translated = translate_legacy_scene(
        _dehydrated(graphics={"grid-yz": {"type": "GRID", "color": "red"}})
    )
    grid = _items(translated)["grid-yz"]
    assert (grid["axes"], grid["visible"], grid["color"]) == ("yz", False, "red")


def test_partially_saved_default_folder_keeps_its_description():
    translated = translate_legacy_scene(
        _dehydrated(folders={"axes": {"isCollapsed": True}})
    )
    folder = _items(translated)["axes"]
    assert (folder["description"], folder["isCollapsed"]) == ("Axes and Grids", "true")


def test_camera_is_scaled_by_the_scenes_axis_scales():
    translated = translate_legacy_scene(
        _dehydrated(
            graphics={
                "axis-x": {"type": "AXIS", "scale": "2"},
                "axis-z": {"type": "AXIS", "scale": "\\frac{1}{4}"},
                "camera": {
                    "type": "CAMERA",
                    "relativePosition": [2, -2, 1],
                    "relativeLookAt": [0, 0, 0],
                },
            }
        )
    )
    assert _items(translated)["camera"]["position"] == "[1.0, -2.0, 4.0]"


@pytest.mark.parametrize(
    ("value", "expected"),
    [("2", 2.0), ("1/2", 0.5), ("\\frac{1}{4}", 0.25), ("1\\ ", 1.0), ("x_{s}", 7.0)],
)
def test_parse_value(value, expected):
    assert parse_value(value, 7.0) == expected
