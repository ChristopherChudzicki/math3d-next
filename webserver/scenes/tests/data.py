from copy import deepcopy

default_scene_data = {
    "title": "Untitled",
    "items": [
        {
            "id": "1",
            "type": "EXPLICIT_SURFACE",
            "properties": {
                "expr": {
                    "name": "_f",
                    "params": ["x", "y"],
                    "rhs": "1 - x^2 - y",
                    "type": "function-assignment",
                },
                "color": "#3498db",
                "grid1": "8",
                "grid2": "8",
                "zBias": "0",
                "domain": {
                    "type": "array",
                    "items": [
                        {
                            "type": "function-assignment",
                            "name": "_f",
                            "params": ["y"],
                            "rhs": "[-5, 5]",
                        },
                        {
                            "type": "function-assignment",
                            "name": "_f",
                            "params": ["x"],
                            "rhs": "[-5, 5]",
                        },
                    ],
                },
                "shaded": "true",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "0.5",
                "visible": True,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "samples1": "64",
                "samples2": "64",
                "colorExpr": {
                    "type": "function-assignment",
                    "name": "_f",
                    "params": ["X", "Y", "Z", "u", "v"],
                    "rhs": "mod(Z, 1)",
                },
                "gridWidth": "2",
                "description": "Explicit Surface",
                "gridOpacity": "0.5",
            },
        },
        {
            "id": "camera",
            "type": "CAMERA",
            "properties": {
                "description": "Camera",
                "updateOnDrag": "true",
                "isPanEnabled": "false",
                "isZoomEnabled": "true",
                "target": "\\left[0, 0, 0\\right]",
                "isOrthographic": "false",
                "isRotateEnabled": "true",
                "position": "\\left[-6, -4, 2\\right]",
                "useRelative": "false",
            },
        },
        {
            "id": "axis-x",
            "type": "AXIS",
            "properties": {
                "max": "+5",
                "min": "-5",
                "axis": "x",
                "size": "6",
                "color": "#808080",
                "label": "x",
                "scale": "1",
                "width": "1",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": True,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "description": "Axis",
                "labelVisible": "true",
                "ticksVisible": "true",
                "end": "true",
                "start": "false",
                "divisions": "10",
            },
        },
        {
            "id": "axis-y",
            "type": "AXIS",
            "properties": {
                "max": "+5",
                "min": "-5",
                "axis": "y",
                "size": "6",
                "color": "#808080",
                "label": "y",
                "scale": "1",
                "width": "1",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": True,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "description": "Axis",
                "labelVisible": "true",
                "ticksVisible": "true",
                "end": "true",
                "start": "false",
                "divisions": "10",
            },
        },
        {
            "id": "axis-z",
            "type": "AXIS",
            "properties": {
                "max": "+5",
                "min": "-5",
                "axis": "z",
                "size": "6",
                "color": "#808080",
                "label": "z",
                "scale": "\\frac{1}{2}",
                "width": "1",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": True,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "description": "Axis",
                "labelVisible": "true",
                "ticksVisible": "true",
                "end": "true",
                "start": "false",
                "divisions": "10",
            },
        },
        {
            "id": "grid-xy",
            "type": "GRID",
            "properties": {
                "axes": "xy",
                "snap": "false",
                "color": "#808080",
                "width": "1/2",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": True,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "divisions": "\\left[10,\\ 10\\right]",
                "description": "Grid",
            },
        },
        {
            "id": "grid-yz",
            "type": "GRID",
            "properties": {
                "axes": "yz",
                "snap": "false",
                "color": "#808080",
                "width": "1/2",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": False,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "divisions": "\\left[10,\\ 10\\right]",
                "description": "Grid",
            },
        },
        {
            "id": "grid-zx",
            "type": "GRID",
            "properties": {
                "axes": "zx",
                "snap": "false",
                "color": "#808080",
                "width": "1/2",
                "zBias": "0",
                "zIndex": "0",
                "zOrder": "",
                "opacity": "1",
                "visible": False,
                "calculatedVisibility": "",
                "useCalculatedVisibility": False,
                "divisions": "\\left[10,\\ 10\\right]",
                "description": "Grid",
            },
        },
        {
            "id": "cameraFolder",
            "type": "FOLDER",
            "properties": {"description": "Camera Controls", "isCollapsed": "false"},
        },
        {
            "id": "axes",
            "type": "FOLDER",
            "properties": {"description": "Axes and Grids", "isCollapsed": "false"},
        },
        {
            "id": "initialFolder",
            "type": "FOLDER",
            "properties": {"description": "A Folder", "isCollapsed": "false"},
        },
    ],
    "itemOrder": {
        "axes": ["axis-x", "axis-y", "axis-z", "grid-xy", "grid-yz", "grid-zx"],
        "main": ["initialFolder"],
        "setup": ["cameraFolder", "axes"],
        "initialFolder": ["1"],
        "cameraFolder": ["camera"],
    },
}


def default_scene():
    return deepcopy(default_scene_data)
