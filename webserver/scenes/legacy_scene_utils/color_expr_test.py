import pytest

from scenes.legacy_scene_utils.color_expr import (
    color_params,
    rewrite_color_body,
    translate_color_expr,
)
from scenes.schemas.math_items import FunctionAssignmentObj


def rescaled(axis: str, arg: str) -> str:
    return rf"\operatorname{{rescale}}_{axis}\left({arg}\right)"


X, Y, Z = rescaled("x", "x"), rescaled("y", "y"), rescaled("z", "z")


@pytest.mark.parametrize(
    ("body", "expected"),
    [
        ("mod(Z, 1)", f"mod({Z}, 1)"),
        ("5Z", f"5{Z}"),
        (r"\pi Z", rf"\pi {Z}"),
        ("Y^Z", f"{Y}^{{{Z}}}"),
        (r"\frac{Z}{2}", rf"\frac{{{Z}}}{{2}}"),
        ("XY", "XY"),
        ("X_1", "X_1"),
        ("x_{Z}", "x_{Z}"),
        ("scaledZ", "scaledZ"),
    ],
)
def test_rewrite_color_body(body, expected):
    assert rewrite_color_body(body, ("x", "y", "z")) == expected


def test_rewrite_color_body_uses_the_slot_names():
    assert (
        rewrite_color_body("X+Z", ("x", "y", r"\$z")) == f"{X}+{rescaled('z', r'\$z')}"
    )


@pytest.mark.parametrize(
    ("kind", "surface_params", "body", "expected"),
    [
        ("explicit", ["x", " y"], r"\arg(z(x,y))", ["x", " y", r"\$z"]),
        ("parametric", ["u", "v"], "mod(z,1)", ["x", "y", r"\$z", "u", "v"]),
        ("parametric", ["x", "y"], "Z", [r"\$x", r"\$y", "z", "x", "y"]),
        ("polar", ["r", r"\theta"], "Z", ["x", "y", "z", "r", r"\theta"]),
    ],
)
def test_color_params(kind, surface_params, body, expected):
    assert color_params(kind, surface_params, body) == expected


def test_explicit_surface_rescales_its_own_params():
    legacy = FunctionAssignmentObj(
        type="function-assignment",
        name="_f",
        params=["X", "Y", "Z", "s", "t"],
        rhs="X+Y",
    )
    translated = translate_color_expr(legacy, "explicit", ["s", "t"])
    assert translated.params == ["s", "t", "z"]
    assert translated.rhs == f"{rescaled('x', 's')}+{rescaled('y', 't')}"
