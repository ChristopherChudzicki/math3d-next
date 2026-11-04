import pytest

from scenes.legacy_scene_utils.color_expr import (
    color_params,
    rewrite_color_body,
    translate_color_expr,
)
from scenes.schemas.math_items import FunctionAssignmentObj

X = r"{\operatorname{rescale}_x\left(x\right)}"
Y = r"{\operatorname{rescale}_y\left(y\right)}"
Z = r"{\operatorname{rescale}_z\left(z\right)}"


@pytest.mark.parametrize(
    ("body", "expected"),
    [
        ("mod(Z, 1)", f"mod({Z}, 1)"),
        ("5Z", f"5{Z}"),
        ("Y^Z", f"{Y}^{Z}"),
        (r"\frac{Z}{2}", rf"\frac{{{Z}}}{{2}}"),
        ("XY", "XY"),
        ("X_1", "X_1"),
        ("scaledZ", "scaledZ"),
    ],
)
def test_rewrite_color_body(body, expected):
    assert rewrite_color_body(body, ("x", "y", "z")) == expected


def test_rewrite_color_body_uses_the_slot_names():
    assert rewrite_color_body("X+Z", ("x", "y", r"\$z")) == (
        rf"{X}+{{\operatorname{{rescale}}_z\left(\$z\right)}}"
    )


@pytest.mark.parametrize(
    ("kind", "surface_params", "body", "expected"),
    [
        ("explicit", ["x", " y"], r"\arg(z(x,y))", ["x", " y", r"\$z"]),
        ("parametric", ["u", "v"], "mod(z,1)", ["x", "y", r"\$z", "u", "v"]),
        ("polar", ["r", r"\theta"], "Z", ["x", "y", "z", "r", r"\theta"]),
    ],
)
def test_color_params(kind, surface_params, body, expected):
    assert color_params(kind, surface_params, body) == expected


def test_translate_color_expr_rewrites_the_default():
    legacy = FunctionAssignmentObj(
        type="function-assignment",
        name="_f",
        params=["X", " Y", " Z", " x", " y"],
        rhs="mod(Z, 1)",
    )
    translated = translate_color_expr(legacy, "explicit", ["x", "y"])
    assert translated.params == ["x", "y", "z"]
    assert translated.rhs == f"mod({Z}, 1)"
    assert translated.name == "_f"
