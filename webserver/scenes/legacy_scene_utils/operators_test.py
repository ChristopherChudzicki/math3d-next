import pytest

from scenes.legacy_scene_utils.operators import rewrite

DIFF = "\\operatorname{diff}"
CROSS_FN = "\\operatorname{cross}"


@pytest.mark.parametrize(
    ("legacy", "expected"),
    [
        (
            (
                f"\\sqrt{{\\frac{{{DIFF}\\left(r,t\\right)|{DIFF}\\left(r,t\\right)}}"
                f"{{{DIFF}\\left(T,t\\right)|{DIFF}\\left(T,t\\right)}}}}"
            ),
            (
                f"\\sqrt{{\\frac{{{DIFF}\\left(r,t\\right)\\cdot{DIFF}\\left(r,t\\right)}}"
                f"{{{DIFF}\\left(T,t\\right)\\cdot{DIFF}\\left(T,t\\right)}}}}"
            ),
        ),
        ("v_f\\ \\&\\ v_d", f"{CROSS_FN}\\left(v_f,v_d\\right)"),
        (
            "\\left(rxa-o\\right)\\&\\left(rxb-o\\right)",
            f"{CROSS_FN}\\left(\\left(rxa-o\\right),\\left(rxb-o\\right)\\right)",
        ),
        ("a+b|c*d", "\\left(a+b\\right)\\cdot\\left(c*d\\right)"),
        ("a<=b|c", "\\left(a<=b\\right)\\cdot c"),
        ("a==b|c", "\\left(a==b\\right)\\cdot c"),
        ("a|b\\&c", f"a\\cdot{CROSS_FN}\\left(b,c\\right)"),
        ("a\\&b\\&c", f"{CROSS_FN}\\left({CROSS_FN}\\left(a,b\\right),c\\right)"),
        ("_f(t)=a|b", "_f(t)=a\\cdot b"),
        (
            "\\left[a|b,c\\&d\\right]",
            f"\\left[a\\cdot b,{CROSS_FN}\\left(c,d\\right)\\right]",
        ),
        ("\\left|x\\right|+\\left|y\\right|", "\\left|x\\right|+\\left|y\\right|"),
    ],
)
def test_dot_and_cross_operators_are_rewritten(legacy, expected):
    assert rewrite(legacy) == (expected, [])


@pytest.mark.parametrize(
    "legacy",
    [
        "|z-2|<|z+2|",
        "x^2+y^2<=4x\\&\\&x^2+y^2<1",
        "a|b?c:d",
        "a\\ or\\ b|c",
        "\\left(a|b",
    ],
)
def test_operators_without_a_clear_reading_are_kept_and_reported(legacy):
    assert rewrite(legacy) == (legacy, [legacy])


def test_only_the_unclear_group_is_kept():
    assert rewrite("\\left(x\\&\\&y\\right)|z") == (
        "\\left(x\\&\\&y\\right)\\cdot z",
        ["x\\&\\&y"],
    )


def test_unbalanced_brackets_without_operators_are_not_reported():
    assert rewrite("\\left|x") == ("\\left|x", [])
