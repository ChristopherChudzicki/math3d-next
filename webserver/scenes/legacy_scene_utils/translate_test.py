import pytest

from scenes.legacy_scene_utils.translate import ItemMigrator


def test_axis():
    migrator = ItemMigrator()
    migrator = ItemMigrator()
    data_in = {"type": "AXIS", "description": "test axis"}
    expected_out = {
        "id": "some-id",
        "type": "AXIS",
        "properties": {
            "axis": "x",
            "color": "#808080",
            "description": "test axis",
            "divisions": "10",
            "end": "true",
            "labelVisible": "true",
            "max": "+5",
            "min": "-5",
            "opacity": "1",
            "scale": "1",
            "size": "2",
            "start": "false",
            "ticksVisible": "true",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "1",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    assert migrator.translate_item(data_in, "axis-x").to_json_data() == {
        **expected_out,
        "id": "axis-x",
        "properties": {
            **expected_out["properties"],
            "axis": "x",
            "label": "x",
        },
    }
    assert migrator.translate_item(data_in, "axis-y").to_json_data() == {
        **expected_out,
        "id": "axis-y",
        "properties": {
            **expected_out["properties"],
            "axis": "y",
            "label": "y",
        },
    }
    assert migrator.translate_item(data_in, "axis-z").to_json_data() == {
        **expected_out,
        "id": "axis-z",
        "properties": {
            **expected_out["properties"],
            "axis": "z",
            "scale": "1/2",
            "label": "z",
        },
    }


def test_boolean_variable():
    migrator = ItemMigrator()
    data_in = {
        "type": "BOOLEAN_VARIABLE",
        "description": "test boolean variable",
    }
    expected_out = {
        "id": "some-id",
        "type": "BOOLEAN_VARIABLE",
        "properties": {
            "description": "test boolean variable",
            "value": {"lhs": "switch", "rhs": "true", "type": "assignment"},
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {
                "relativePosition": [0.1, 0.2, 0.3],
                "computedPosition": "[1+1, 2, 3]",
                "relativeLookAt": [0, 0, -0.1],
                "computedLookAt": "[0, 0, -1]",
                "useComputed": False,
            },
            {
                "useRelative": "true",
                "position": "[0.1, 0.2, 0.6]",
                "target": "[0.0, 0.0, -0.2]",
            },
        ),
        (
            {
                "relativePosition": [0.1, 0.2, 0.3],
                "computedPosition": "[1+1, 2, 3]",
                "relativeLookAt": [0, 0, -0.1],
                "computedLookAt": "[0, 0, -1]",
                "useComputed": True,
            },
            {"useRelative": "false", "position": "[1+1, 2, 3]", "target": "[0, 0, -1]"},
        ),
    ],
)
def test_camera(in_patch, out_patch):
    migrator = ItemMigrator()
    data_in = {
        "type": "CAMERA",
        "description": "test camera",
        **in_patch,
    }
    expected_out = {
        "id": "some-id",
        "type": "CAMERA",
        "properties": {
            "description": "test camera",
            "isOrthographic": "false",
            "isPanEnabled": "false",
            "isRotateEnabled": "true",
            "isZoomEnabled": "true",
            "position": "[0.5, -2, 0.5]",
            "target": "[0, 0, 0]",
            "updateOnDrag": "true",
            "useRelative": "true",
            **out_patch,
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {
                "visible": True,
                "useCalculatedVisibility": True,
                "calculatedVisibility": "!false",
            },
            {
                "visible": True,
                "useCalculatedVisibility": True,
                "calculatedVisibility": "!false",
            },
        ),
        (
            {
                "useCalculatedVisibility": True,
                "calculatedVisibility": "!true",
                "visible": False,
            },
            {
                "visible": False,
                "useCalculatedVisibility": True,
                "calculatedVisibility": "!true",
            },
        ),
    ],
)
def test_explicit_surface(in_patch, out_patch):
    migrator = ItemMigrator()
    data_in = {"type": "EXPLICIT_SURFACE", **in_patch}
    expected_out = {
        "id": "some-id",
        "type": "EXPLICIT_SURFACE",
        "properties": {
            "color": "#3090FF",
            "colorExpr": {
                "name": "_f",
                "params": ["X", " Y", " Z", " x", " y"],
                "rhs": "mod(Z, 1)",
                "type": "function-assignment",
            },
            "description": "Explicit Surface",
            "domain": {
                "items": [
                    {
                        "name": "_f",
                        "params": ["y"],
                        "rhs": "\\left[-2,\\ 2\\right]",
                        "type": "function-assignment",
                    },
                    {
                        "name": "_f",
                        "params": ["x"],
                        "rhs": "\\left[-2,\\ 2\\right]",
                        "type": "function-assignment",
                    },
                ],
                "type": "array",
            },
            "expr": {
                "name": "_f",
                "params": ["x", "y"],
                "rhs": "x^2-y^2",
                "type": "function-assignment",
            },
            "grid1": "8",
            "grid2": "8",
            "gridOpacity": "0.5",
            "gridWidth": "2",
            "opacity": "0.75",
            "samples1": "64",
            "samples2": "64",
            "shaded": "true",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
            **out_patch,
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {
                "useCalculatedVisibility": False,
                "calculatedVisibility": "!false",
                "visible": False,
            },
            {
                "useCalculatedVisibility": False,
                "calculatedVisibility": "!false",
                "visible": False,
            },
        ),
    ],
)
def test_explicit_surface_polar(in_patch, out_patch):
    migrator = ItemMigrator()
    data_in = {"type": "EXPLICIT_SURFACE_POLAR", **in_patch}
    expected_out = {
        "id": "some-id",
        "type": "EXPLICIT_SURFACE_POLAR",
        "properties": {
            "color": "#3090FF",
            "colorExpr": {
                "name": "_f",
                "params": ["X", " Y", " Z", " r", " \\theta"],
                "rhs": "mod(Z, 1)",
                "type": "function-assignment",
            },
            "description": "Explicit Surface (Polar)",
            "domain": {
                "items": [
                    {
                        "name": "_f",
                        "params": ["Q"],
                        "rhs": "\\left[0,\\ 3\\right]",
                        "type": "function-assignment",
                    },
                    {
                        "name": "_f",
                        "params": ["r"],
                        "rhs": "\\left[-\\pi,\\ \\pi\\right]",
                        "type": "function-assignment",
                    },
                ],
                "type": "array",
            },
            "expr": {
                "name": "_f",
                "params": ["r", "\\theta"],
                "rhs": "\\frac{1}{4}r^2\\cdot\\cos\\left(3\\theta\\right)",
                "type": "function-assignment",
            },
            "grid1": "8",
            "grid2": "8",
            "gridOpacity": "0.5",
            "gridWidth": "2",
            "opacity": "0.75",
            "samples1": "64",
            "samples2": "64",
            "shaded": "true",
            "visible": "false",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
            **out_patch,
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_folder():
    migrator = ItemMigrator()
    data_in = {
        "type": "FOLDER",
        "isCollapsed": True,
        "description": "test folder",
    }
    expected_out = {
        "id": "some-id",
        "type": "FOLDER",
        "properties": {"description": "test folder", "isCollapsed": "true"},
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_grid():
    migrator = ItemMigrator()
    data_in = {"type": "GRID", "color": "red"}
    expected_out = {
        "id": "some-id",
        "type": "GRID",
        "properties": {
            "axes": "xy",
            "color": "red",
            "description": "Grid",
            "divisions": "\\left[10,\\ 10\\right]",
            "opacity": "1",
            "snap": "false",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "1/2",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_implicit_surface():
    migrator = ItemMigrator()
    data_in = {
        "type": "IMPLICIT_SURFACE",
    }
    expected_out = {
        "id": "some-id",
        "type": "IMPLICIT_SURFACE",
        "properties": {
            "color": "#3090FF",
            "description": "Implicit Surface",
            "domain": {
                "items": [
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                ],
                "type": "array",
            },
            "lhs": {
                "name": "_f",
                "params": ["x", "y", "z"],
                "rhs": "x^2+y^2",
                "type": "function-assignment",
            },
            "opacity": "1",
            "rhs": {
                "name": "_f",
                "params": ["x", "y", "z"],
                "rhs": "z^2+1",
                "type": "function-assignment",
            },
            "samples": "20",
            "shaded": "true",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_line():
    migrator = ItemMigrator()
    data_in = {
        "type": "LINE",
    }
    expected_out = {
        "id": "some-id",
        "type": "LINE",
        "properties": {
            "color": "#3090FF",
            "coords": "\\left[\\left[1,1,1\\right], \\left[-1,1,-1\\right]\\right]",
            "description": "Line",
            "end": "false",
            "label": "",
            "labelVisible": "false",
            "opacity": "1",
            "size": "6",
            "start": "false",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "4",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_parametric_curve():
    migrator = ItemMigrator()
    data_in = {
        "type": "PARAMETRIC_CURVE",
    }
    expected_out = {
        "id": "some-id",
        "type": "PARAMETRIC_CURVE",
        "properties": {
            "color": "#3090FF",
            "description": "Parametric Curve",
            "domain": {
                "items": [{"expr": "\\left[-2\\pi,\\ 2\\pi\\right]", "type": "expr"}],
                "type": "array",
            },
            "end": "false",
            "expr": {
                "name": "_f",
                "params": ["t"],
                "rhs": "\\left[\\cos\\left(t\\right),\\ \\sin\\left(t\\right),\\ t\\right]",
                "type": "function-assignment",
            },
            "opacity": "1",
            "samples1": "128",
            "size": "6",
            "start": "false",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "4",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_parametric_surface():
    migrator = ItemMigrator()
    data_in = {
        "type": "PARAMETRIC_SURFACE",
    }
    expected_out = {
        "id": "some-id",
        "type": "PARAMETRIC_SURFACE",
        "properties": {
            "color": "#3090FF",
            "colorExpr": {
                "name": "_f",
                "params": ["X", " Y", " Z", " u", " v"],
                "rhs": "mod(Z, 1)",
                "type": "function-assignment",
            },
            "description": "Parametric Surface",
            "domain": {
                "items": [
                    {
                        "name": "_f",
                        "params": ["v"],
                        "rhs": "\\left[-\\pi,\\ \\pi\\right]",
                        "type": "function-assignment",
                    },
                    {
                        "name": "_f",
                        "params": ["u"],
                        "rhs": "\\left[-3, 3\\right]",
                        "type": "function-assignment",
                    },
                ],
                "type": "array",
            },
            "expr": {
                "name": "_f",
                "params": ["u", "v"],
                "rhs": "\\left[v\\cdot\\cos\\left(u\\right),v\\cdot\\sin\\left(u\\right),v\\right]",
                "type": "function-assignment",
            },
            "grid1": "8",
            "grid2": "8",
            "gridOpacity": "0.5",
            "gridWidth": "2",
            "opacity": "0.75",
            "samples1": "64",
            "samples2": "64",
            "shaded": "true",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_point():
    migrator = ItemMigrator()
    data_in = {
        "type": "POINT",
    }
    expected_out = {
        "id": "some-id",
        "type": "POINT",
        "properties": {
            "color": "#3090FF",
            "coords": "\\left[0,0,0\\right]",
            "description": "Point",
            "label": "",
            "labelVisible": "false",
            "opacity": "1",
            "size": "16",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_variable():
    migrator = ItemMigrator()
    data_in = {
        "type": "VARIABLE",
    }
    expected_out = {
        "id": "some-id",
        "type": "VARIABLE",
        "properties": {
            "description": "Variable or Function",
            "value": {"lhs": "f(x)", "rhs": "e^x", "type": "assignment"},
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [({}, {}), ({"speedMultiplier": 0.25}, {"speedMultiplier": "1/4"})],
)
def test_variable_slider(in_patch, out_patch):
    migrator = ItemMigrator()
    data_in = {"type": "VARIABLE_SLIDER", **in_patch}
    expected_out = {
        "id": "some-id",
        "type": "VARIABLE_SLIDER",
        "properties": {
            "description": "Variable Slider",
            "duration": "4",
            "fps": "30",
            "isAnimating": "false",
            "range": {"items": ["-5", "5"], "type": "array"},
            "speedMultiplier": "1",
            "value": {"lhs": "T", "rhs": "None", "type": "assignment"},
            **out_patch,
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


def test_vector():
    migrator = ItemMigrator()
    data_in = {
        "type": "VECTOR",
    }
    expected_out = {
        "id": "some-id",
        "type": "VECTOR",
        "properties": {
            "color": "#3090FF",
            "components": "\\left[3,2,1\\right]",
            "description": "Vector",
            "end": "true",
            "label": "",
            "labelVisible": "false",
            "opacity": "1",
            "size": "6",
            "start": "false",
            "tail": "\\left[0,0,0\\right]",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "4",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {},
            {},
        ),
        (
            {"samples": "[10, 20, 30]"},
            {
                "samples1": "10",
                "samples2": "20",
                "samples3": "30",
            },
        ),
    ],
)
def test_vector_field(in_patch, out_patch):
    migrator = ItemMigrator()
    data_in = {"type": "VECTOR_FIELD", **in_patch}
    expected_out = {
        "type": "VECTOR_FIELD",
        "id": "some-id",
        "properties": {
            "color": "#3090FF",
            "description": "Vector Field",
            "domain": {
                "items": [
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                    {"expr": "\\left[-5,\\ 5\\right]", "type": "expr"},
                ],
                "type": "array",
            },
            "end": "true",
            "expr": {
                "name": "_f",
                "params": ["x", "y", "z"],
                "rhs": "\\frac{[y,\\ -x,\\ 0]}{\\sqrt{x^2+y^2}}",
                "type": "function-assignment",
            },
            "opacity": "1",
            "samples1": "10",
            "samples2": "10",
            "samples3": "5",
            "scale": "1",
            "size": "6",
            "start": "false",
            "visible": True,
            "calculatedVisibility": "",
            "useCalculatedVisibility": False,
            "width": "2",
            "zBias": "0",
            "zIndex": "0",
            "zOrder": "",
            **out_patch,
        },
    }
    actual_out = migrator.translate_item(data_in, "some-id").to_json_data()
    assert expected_out == actual_out
