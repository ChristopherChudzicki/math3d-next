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


def test_camera():
    data_in = {
        "type": "CAMERA",
        "id": "some-item",
        "description": "test camera",
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
        },
    }
    actual_out = translate_item(data_in).to_json_data()
    assert expected_out == actual_out
