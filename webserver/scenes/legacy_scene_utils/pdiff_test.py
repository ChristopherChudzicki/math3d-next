import pytest

from scenes.legacy_scene_utils.pdiff import rewrite

PDIFF = "\\operatorname{pdiff}"


@pytest.mark.parametrize(
    ("legacy", "expected"),
    [
        (
            f"{PDIFF}\\left(f,x,y,1\\right)",
            "\\frac{\\partial f\\left(x,y\\right)}{\\partial x}",
        ),
        (
            f"{PDIFF}\\left(f,\\ x,\\ y,\\ 2\\right)",
            "\\frac{\\partial f\\left(x,y\\right)}{\\partial y}",
        ),
        (
            f"{PDIFF}\\left(F,z,1\\right)",
            "\\frac{\\partial F\\left(z\\right)}{\\partial z}",
        ),
        (
            f"\\left[{PDIFF}\\left(D,x,y,0,1\\right),{PDIFF}\\left(D,x,y,0,2\\right)\\right]",
            (
                "\\left[\\frac{\\partial D\\left(x,y,0\\right)}{\\partial x},"
                "\\frac{\\partial D\\left(x,y,0\\right)}{\\partial y}\\right]"
            ),
        ),
        (
            f"{PDIFF}\\left(f,{PDIFF}\\left(g,x,1\\right),y,2\\right)",
            (
                "\\frac{\\partial f\\left(\\frac{\\partial g\\left(x\\right)}"
                "{\\partial x},y\\right)}{\\partial y}"
            ),
        ),
    ],
)
def test_pdiff_becomes_partial_derivative_notation(legacy, expected):
    assert rewrite(legacy) == (expected, [])


@pytest.mark.parametrize(
    ("legacy", "expected"),
    [
        # A point that isn't a name can't be the variable of differentiation.
        (
            f"{PDIFF}\\left(g,5,1,1\\right)",
            "\\operatorname{diff}\\left(g,5,1\\right)\\left[1\\right]",
        ),
        # The notation would differentiate every x, not just the first.
        (
            f"{PDIFF}\\left(f,x,2x,1\\right)",
            "\\operatorname{diff}\\left(f,x,2x\\right)\\left[1\\right]",
        ),
        (
            f"{PDIFF}\\left(f,x_{{12}},x_12+y,1\\right)",
            "\\operatorname{diff}\\left(f,x_{12},x_12+y\\right)\\left[1\\right]",
        ),
        (
            f"{PDIFF}\\left(f\\left(z\\right),x,y,1\\right)",
            "\\operatorname{diff}\\left(f\\left(z\\right),x,y\\right)\\left[1\\right]",
        ),
        (
            f"{PDIFF}\\left(f,x,y,3\\right)",
            "\\operatorname{diff}\\left(f,x,y\\right)\\left[3\\right]",
        ),
        (
            f"{PDIFF}\\left(f,1,a,b\\right)",
            "\\operatorname{diff}\\left(f,1,a\\right)\\left[b\\right]",
        ),
        (
            f"{PDIFF}\\left(F,2,1\\right)",
            "\\operatorname{diff}\\left(F,2\\right)",
        ),
    ],
)
def test_pdiff_falls_back_to_indexing_diff(legacy, expected):
    assert rewrite(legacy) == (expected, [])


@pytest.mark.parametrize(
    "legacy",
    [
        f"{PDIFF}\\left(\\right)",
        f"{PDIFF}\\left(F,z,2\\right)",
        f"{PDIFF}\\left(f,x,1",
    ],
)
def test_pdiff_without_an_equivalent_is_kept_and_reported(legacy):
    assert rewrite(legacy) == (legacy, [legacy])
