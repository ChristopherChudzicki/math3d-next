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
                "useRelative": True,
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
            {"useRelative": False, "position": "[1+1, 2, 3]", "target": "[0, 0, -1]"},
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
            "isOrthographic": False,
            "isPanEnabled": False,
            "isRotateEnabled": True,
            "isZoomEnabled": True,
            "position": "[0.5, -2, 0.5]",
            "target": "[0, 0, 0]",
            "updateOnDrag": "true",
            "useRelative": True,
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
