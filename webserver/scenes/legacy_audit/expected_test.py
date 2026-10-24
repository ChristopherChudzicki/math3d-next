import itertools
import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel

from scenes.legacy_audit import expected as table
from scenes.legacy_audit.expected import Context, Expectation, NeedsEval
from scenes.schemas import math_items as m

FIXTURE = json.loads(
    (Path(__file__).parent / "fixtures" / "react_defaults.json").read_text()
)
DEFAULTS: dict[str, dict] = FIXTURE["defaultSettings"]
INITIAL_GRAPHICS: dict[str, dict] = FIXTURE["initialState"]["mathGraphics"]

MODELS: dict[str, type[BaseModel]] = {
    "FOLDER": m.FolderProperties,
    "VARIABLE": m.VariableProperties,
    "VARIABLE_SLIDER": m.VariableSliderProperties,
    "BOOLEAN_VARIABLE": m.BooleanVariableProperties,
    "CAMERA": m.CameraProperties,
    "AXIS": m.AxisProperties,
    "GRID": m.GridProperties,
    "POINT": m.PointProperties,
    "LINE": m.LineProperties,
    "VECTOR": m.VectorProperties,
    "PARAMETRIC_CURVE": m.ParametricCurveProperties,
    "PARAMETRIC_SURFACE": m.ParametricSurfaceProperties,
    "EXPLICIT_SURFACE": m.ExplicitSurfaceProperties,
    "EXPLICIT_SURFACE_POLAR": m.ExplicitSurfacePolarProperties,
    "IMPLICIT_SURFACE": m.ImplicitSurfaceProperties,
    "VECTOR_FIELD": m.VectorFieldProperties,
}

SLIDER_ID = "slider"


def rehydrated(item_type: str, initial_id: str | None = None) -> dict:
    """An item as math3d-react's rehydrate builds it from defaults (+ initialState)."""
    initial = INITIAL_GRAPHICS.get(initial_id, {}) if initial_id else {}
    return {"type": item_type, **DEFAULTS[item_type], **initial}


def context(axes: dict[str, dict] | None = None, slider_values: Any = None) -> Context:
    default_axes = {k: rehydrated("AXIS", k) for k in ("axis-x", "axis-y", "axis-z")}
    return Context(
        item_id=SLIDER_ID,
        axes=axes if axes is not None else default_axes,
        slider_values={SLIDER_ID: 0} if slider_values is None else slider_values,
    )


DEFAULT_CASES = [
    *[(t, None) for t in table.LEGACY_TYPES],
    *[(v["type"], k) for k, v in INITIAL_GRAPHICS.items()],
]


def expect(item: dict, ctx: Context | None = None) -> dict[str, Expectation]:
    exps = table.EXPECTATIONS[item["type"]](item, ctx or context())
    paths = [e.path for e in exps]
    assert len(paths) == len(set(paths)), "duplicate expectation paths"
    return {e.path: e for e in exps}


def values(item: dict, ctx: Context | None = None) -> dict[str, Any]:
    return {p: e.value for p, e in expect(item, ctx).items()}


def assemble(exps: dict[str, Expectation]) -> dict:
    root: dict = {}
    for path, exp in exps.items():
        parts = path.split(".")
        node: Any = root
        for part, nxt in itertools.pairwise(parts):
            key: Any = int(part) if isinstance(node, list) else part
            child: list | dict = [] if nxt.isdigit() else {}
            if isinstance(node, list):
                while len(node) <= key:
                    node.append(None)
                if node[key] is None:
                    node[key] = child
            else:
                node.setdefault(key, child)
            node = node[key]
        last = parts[-1]
        if isinstance(node, list):
            while len(node) <= int(last):
                node.append(None)
            node[int(last)] = exp.value
        else:
            node[last] = exp.value
    return root


def leaf_paths(obj: Any, prefix: str = "") -> set[str]:
    children: list[tuple[str, Any]]
    if isinstance(obj, dict):
        children = list(obj.items())
    elif isinstance(obj, list):
        children = [(str(i), v) for i, v in enumerate(obj)]
    else:
        return {prefix}
    paths: set[str] = set()
    for key, value in children:
        paths |= leaf_paths(value, f"{prefix}.{key}" if prefix else key)
    return paths


def test_tables_cover_all_types():
    assert set(DEFAULTS) == set(table.LEGACY_TYPES)
    assert set(table.EXPECTATIONS) == set(table.LEGACY_TYPES)
    assert set(table.COVERAGE) == set(table.LEGACY_TYPES)
    assert table.LEGACY_TYPE_TO_NEXT_TYPE.keys() == set(table.LEGACY_TYPES)


@pytest.mark.parametrize("item_type", table.LEGACY_TYPES)
def test_coverage_names_every_default_property(item_type):
    missing = set(DEFAULTS[item_type]) - {"type"} - set(table.COVERAGE[item_type])
    assert not missing


@pytest.mark.parametrize(("item_type", "initial_id"), DEFAULT_CASES)
def test_defaults_produce_valid_complete_properties(item_type, initial_id):
    exps = expect(rehydrated(item_type, initial_id))
    assert not [p for p, e in exps.items() if isinstance(e.value, NeedsEval)]
    assert all(
        e.severity in ("render", "editor", "none") and e.source for e in exps.values()
    )

    model = MODELS[item_type].model_validate(assemble(exps))

    assert set(exps) == leaf_paths(model.model_dump(mode="json"))


def test_camera_default_uses_relative_coordinates_divided_by_axis_scale():
    # axis-z has scale 1/2, so world z 0.5 is relative z 1.
    got = values(rehydrated("CAMERA", "camera"))
    assert got["position"] == "[0.5, -2, 1]"
    assert got["target"] == "[0, 0, 0]"
    assert got["useRelative"] == "true"
    assert got["updateOnDrag"] == "true"


def test_orthographic_camera_undoes_the_saved_dolly():
    camera = {
        **rehydrated("CAMERA", "camera"),
        "isOrthographic": True,
        "relativePosition": [5, -100, 50],
        "relativeLookAt": [0, 0, 0],
    }
    assert values(camera)["position"] == "[0.1, -2, 2]"


def test_computed_camera_uses_computed_expressions():
    camera = {**rehydrated("CAMERA", "camera"), "useComputed": True}
    got = values(camera)
    assert got["position"] == camera["computedPosition"]
    assert got["target"] == camera["computedLookAt"]
    assert got["useRelative"] == "false"
    assert got["updateOnDrag"] == "false"


def test_camera_needs_eval_when_axis_scale_is_not_a_plain_number():
    axes = context().axes | {
        "axis-x": {**rehydrated("AXIS", "axis-x"), "scale": "2\\pi"}
    }
    got = values(rehydrated("CAMERA", "camera"), context(axes=axes))
    assert isinstance(got["position"], NeedsEval)
    assert isinstance(got["target"], NeedsEval)


@pytest.mark.parametrize(
    ("manual", "slider_values", "rhs"),
    [
        ("\\pi", {SLIDER_ID: 3}, "\\pi"),
        (None, {SLIDER_ID: 0.37}, "0.37"),
        (None, {SLIDER_ID: 2.0}, "2"),
    ],
)
def test_slider_value_prefers_manual_value(manual, slider_values, rhs):
    slider = {**rehydrated("VARIABLE_SLIDER"), "value": manual}
    assert values(slider, context(slider_values=slider_values))["value.rhs"] == rhs


def test_slider_without_any_value_needs_eval():
    slider = rehydrated("VARIABLE_SLIDER")
    got = values(slider, context(slider_values={}))
    assert isinstance(got["value.rhs"], NeedsEval)


def test_slider_speed_takes_the_nearest_next_option():
    slider = {**rehydrated("VARIABLE_SLIDER"), "speedMultiplier": 1.5}
    assert values(slider)["speedMultiplier"] == "2"
    slider["speedMultiplier"] = 0.0625
    assert values(slider)["speedMultiplier"] == "1/16"
    slider["speedMultiplier"] = "s"
    assert isinstance(values(slider)["speedMultiplier"], NeedsEval)


def test_surface_domain_is_range_u_then_range_v():
    got = values(rehydrated("PARAMETRIC_SURFACE"))
    assert got["domain.items.0.params.0"] == "v"
    assert got["domain.items.0.rhs"] == DEFAULTS["PARAMETRIC_SURFACE"]["rangeU"]
    assert got["domain.items.1.params.0"] == "u"
    assert got["domain.items.1.rhs"] == DEFAULTS["PARAMETRIC_SURFACE"]["rangeV"]
    assert (got["samples1"], got["grid1"]) == ("64", "8")


def test_surface_range_depending_on_second_parameter_swaps_sampling():
    surface = {
        **rehydrated("EXPLICIT_SURFACE_POLAR"),
        "rangeU": "_f(\\theta)=\\left[0,\\ \\theta\\right]",
        "uSamples": "10",
        "vSamples": "20",
        "gridU": "3",
        "gridV": "4",
    }
    got = values(surface)
    assert got["domain.items.0.params.0"] == "\\theta"
    assert got["domain.items.0.rhs"] == "\\left[0,\\ \\theta\\right]"
    assert got["domain.items.1.params.0"] == "r"
    assert (got["samples1"], got["samples2"], got["grid1"], got["grid2"]) == (
        "20",
        "10",
        "4",
        "3",
    )


def test_blank_calculated_visibility_keeps_the_authors_visibility():
    point = {
        **rehydrated("POINT"),
        "useCalculatedVisibility": True,
        "calculatedVisibility": "\\ \\quad",
        "visible": False,
    }
    got = values(point)
    assert got["useCalculatedVisibility"] is False
    assert got["visible"] is False
    assert got["calculatedVisibility"] == ""


def test_z_order_uses_next_automatic_order_regardless_of_opacity():
    assert values(rehydrated("PARAMETRIC_SURFACE"))["zOrder"] == ""


def test_vector_field_samples_split_into_components():
    field = {**rehydrated("VECTOR_FIELD"), "samples": "\\left[n,\\ 2,\\ 5\\right]"}
    got = values(field)
    assert (got["samples1"], got["samples2"], got["samples3"]) == ("n", "2", "5")


def test_blank_z_index_becomes_zero():
    assert values({**rehydrated("GRID", "grid-xy"), "zIndex": ""})["zIndex"] == "0"
