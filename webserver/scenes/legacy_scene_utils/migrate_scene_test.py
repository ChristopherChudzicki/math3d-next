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


def test_customized_default_z_axis_keeps_its_label_and_scale():
    translated = translate_legacy_scene(
        _dehydrated(graphics={"axis-z": {"type": "AXIS", "color": "red"}})
    )
    axis = _items(translated)["axis-z"]
    assert (axis["axis"], axis["label"], axis["scale"]) == ("z", "z", "1/2")


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


def test_negative_axis_scale_keeps_its_sign():
    # math3d-react saved world coordinates; math3d-next multiplies the stored
    # position by the signed scale.
    translated = translate_legacy_scene(
        _dehydrated(
            graphics={
                "axis-z": {"type": "AXIS", "scale": "-0.5"},
                "camera": {"type": "CAMERA", "relativePosition": [3, -3, 2]},
            }
        )
    )
    assert _items(translated)["camera"]["position"] == "[3.0, -3.0, -4.0]"
    assert translated.issues == []


def _camera_position(x_scale: str):
    translated = translate_legacy_scene(
        _dehydrated(
            graphics={
                "axis-x": {"type": "AXIS", "scale": x_scale},
                "camera": {"type": "CAMERA", "relativePosition": [2, -2, 1]},
            }
        )
    )
    return _items(translated)["camera"]["position"], translated.issues


def test_symbolic_axis_scale_divides_the_camera_as_an_expression():
    assert _camera_position("x_{s}") == (
        "\\left[\\frac{2}{x_{s}},-2.0,2.0\\right]",
        [],
    )


def test_symbolic_axis_scale_shifts_its_indices_for_the_camera_and_the_axis():
    translated = translate_legacy_scene(
        _dehydrated(
            graphics={
                "axis-x": {"type": "AXIS", "scale": "s\\left[1\\right]"},
                "camera": {"type": "CAMERA", "relativePosition": [2, -2, 1]},
            }
        )
    )
    items = _items(translated)
    assert items["camera"]["position"].startswith("\\left[\\frac{2}{s\\left[0\\right]}")
    assert items["axis-x"]["scale"] == "s\\left[0\\right]"


def test_blank_axis_scale_is_one():
    assert _camera_position("\\ ") == ("[2.0, -2.0, 2.0]", [])


def test_zero_axis_scale_falls_back_to_default_with_a_warning():
    position, issues = _camera_position("0")
    assert position == "[2.0, -2.0, 2.0]"
    assert [i.message for i in issues] == [
        "axis-x: Camera uses scale 1.0; can't use axis scale '0'"
    ]


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("2", 2.0),
        ("1/2", 0.5),
        ("\\frac{1}{4}", 0.25),
        ("-\\frac{1}{4}", -0.25),
        ("1\\ ", 1.0),
        ("x_{s}", 7.0),
        ("inf", 7.0),
    ],
)
def test_parse_value(value, expected):
    assert parse_value(value, 7.0) == expected
