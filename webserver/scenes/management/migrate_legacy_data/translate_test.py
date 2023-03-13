import pytest

from scenes.management.migrate_legacy_data.translate import translate_item


def test_axis():
    data_in = {"type": "AXIS", "id": "some-item", "description": "test axis"}
    expected_out = {
        "type": "AXIS",
        "id": "some-item",
        "properties": {
            "axis": "x",
            "color": "#808080",
            "description": "test axis",
            "divisions": "10",
            "end": "true",
            "label": "",
            "labelVisible": "true",
            "max": "+5",
            "min": "-5",
            "opacity": "1",
            "scale": "1",
            "size": "2",
            "start": "false",
            "ticksVisible": "true",
            "visible": "true",
            "width": "1",
            "zBias": "0",
            "zIndex": "0",
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert actual_out == expected_out


def test_boolean_variable():
    data_in = {
        "type": "BOOLEAN_VARIABLE",
        "id": "some-item",
        "description": "test boolean variable",
    }
    expected_out = {
        "type": "BOOLEAN_VARIABLE",
        "id": "some-item",
        "properties": {
            "description": "test boolean variable",
            "value": {"lhs": "switch", "rhs": "true", "type": "assignment"},
        },
    }
    actual_out = translate_item(data_in).to_json_data()
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
                "position": "[0.1, 0.2, 0.3]",
                "target": "[0, 0, -0.1]",
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
    data_in = {
        "type": "CAMERA",
        "id": "some-item",
        "description": "test camera",
        **in_patch,
    }
    expected_out = {
        "type": "CAMERA",
        "id": "some-item",
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
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {"useCalculatedVisibility": True, "calculatedVisibility": "!false"},
            {"visible": "!false"},
        ),
        (
            {
                "useCalculatedVisibility": False,
                "calculatedVisibility": "!false",
                "visible": False,
            },
            {"visible": "false"},
        ),
    ],
)
def test_explicit_surface(in_patch, out_patch):
    data_in = {"type": "EXPLICIT_SURFACE", "id": "some-item", **in_patch}
    expected_out = {
        "type": "EXPLICIT_SURFACE",
        "id": "some-item",
        "properties": {
            "color": "#3090FF",
            "colorExpr": "_f(X, Y, Z, x, y)=mod(Z, 1)",
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
            "visible": "true",
            "zBias": "0",
            "zIndex": "0",
            **out_patch,
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out


@pytest.mark.parametrize(
    ("in_patch", "out_patch"),
    [
        (
            {"useCalculatedVisibility": True, "calculatedVisibility": "!false"},
            {"visible": "!false"},
        ),
        (
            {
                "useCalculatedVisibility": False,
                "calculatedVisibility": "!false",
                "visible": False,
            },
            {"visible": "false"},
        ),
    ],
)
def test_explicit_surface_polar(in_patch, out_patch):
    data_in = {"type": "EXPLICIT_SURFACE_POLAR", "id": "some-item", **in_patch}
    expected_out = {
        "type": "EXPLICIT_SURFACE_POLAR",
        "id": "some-item",
        "properties": {
            "color": "#3090FF",
            "colorExpr": "_f(X, Y, Z, r, \\theta)=mod(Z, 1)",
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
            **out_patch,
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out


def test_folder():
    data_in = {
        "type": "FOLDER",
        "id": "some-item",
        "isCollapsed": True,
        "description": "test folder",
    }
    expected_out = {
        "type": "FOLDER",
        "id": "some-item",
        "properties": {"description": "test folder", "isCollapsed": "true"},
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out


def test_grid():
    data_in = {"type": "GRID", "id": "some-item", "color": "red"}
    expected_out = {
        "type": "GRID",
        "id": "some-item",
        "properties": {
            "axes": "xy",
            "color": "red",
            "description": "Grid",
            "divisions": "\\left[10,\\ 10\\right]",
            "opacity": "1",
            "snap": "false",
            "visible": "true",
            "width": "1/2",
            "zBias": "0",
            "zIndex": "0",
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out


def test_implicit_surface():
    data_in = {"type": "IMPLICIT_SURFACE", "id": "some-item"}
    expected_out = {
        "type": "IMPLICIT_SURFACE",
        "id": "some-item",
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
            "visible": "true",
            "zBias": "0",
            "zIndex": "0",
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out
