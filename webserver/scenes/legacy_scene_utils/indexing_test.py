import pytest

from scenes.legacy_scene_utils.indexing import shift_indices


@pytest.mark.parametrize(
    ("legacy", "shifted"),
    [
        ("a\\left[1\\right]", "a\\left[0\\right]"),
        ("a\\left\\lbrack 2\\right\\rbrack", "a\\left\\lbrack 1\\right\\rbrack"),
        ("A\\left[1,2\\right]", "A\\left[0,1\\right]"),
        ("f\\left(t\\right)\\left[3\\right]", "f\\left(t\\right)\\left[2\\right]"),
        ("V_{a}\\left[2\\right]", "V_{a}\\left[1\\right]"),
        ("q_{12}\\left[2\\right]", "q_{12}\\left[1\\right]"),
        ("\\operatorname{f}\\left[1\\right]", "\\operatorname{f}\\left[0\\right]"),
        ("\\alpha\\left[1\\right]", "\\alpha\\left[0\\right]"),
        ("n!\\left[1\\right]", "n!\\left[0\\right]"),
        # Not after an operand, "or" is a name.
        ("\\left[or\\left[1\\right]\\right]", "\\left[or\\left[0\\right]\\right]"),
        ("a\\left[i\\right]", "a\\left[i-1\\right]"),
        ("a\\left[i+1\\right]", "a\\left[i\\right]"),
        ("a\\left[i\\ +\\ 1\\right]", "a\\left[i\\right]"),
        # 2e+1 is the number 20.
        ("a\\left[2e+1\\right]", "a\\left[2e+1-1\\right]"),
        ("a\\left[2i-1\\right]", "a\\left[2i-2\\right]"),
        ("a\\left[x<y\\right]", "a\\left[\\left(x<y\\right)-1\\right]"),
        ("a\\left[x?1:2\\right]", "a\\left[\\left(x?1:2\\right)-1\\right]"),
        # math3d-next's parser reads \, as a comma.
        ("a\\left[1\\,2\\right]", "a\\left[0\\,1\\right]"),
        ("a\\left[end\\right]", "a\\left[end-1\\right]"),
        ("a\\left[b\\left[1\\right]\\right]", "a\\left[b\\left[0\\right]-1\\right]"),
        ("a\\left[1:3\\right]", "a\\left[0:3\\right]"),
        ("a\\left[3:-1:1\\right]", "a\\left[2:-1:-1\\right]"),
        ("m\\left[2,:\\right]", "m\\left[1,0:\\right]"),
    ],
)
def test_shifts_indices(legacy, shifted):
    assert shift_indices(legacy) == (shifted, [])


@pytest.mark.parametrize(
    "latex",
    [
        "\\left[1,2,3\\right]",
        "2\\left[1,2\\right]",
        "\\sqrt[3]{x}",
        "x\\ and\\ \\left[1,2\\right]",
        "r\\ \\in\\left[0,1\\right]",
        # The subscript's braces go, so the bracket follows "=": an assignment.
        "P_{b=}\\left[1,2\\right]",
    ],
)
def test_leaves_brackets_that_are_not_indices(latex):
    assert shift_indices(latex) == (latex, [])


@pytest.mark.parametrize(
    ("latex", "problem"),
    [
        ("a\\left[\\right]", "an empty index"),
        ("a\\left[1:2:3:4\\right]", "a malformed range index"),
        ("a\\left[" * 51 + "1" + "\\right]" * 51, "brackets nested more than 50 deep"),
    ],
)
def test_reports_an_index_it_cannot_shift(latex, problem):
    assert shift_indices(latex) == (latex, [problem])


def test_shifts_the_start_of_a_range_with_a_symbolic_step_and_reports_it():
    assert shift_indices("a\\left[1:s:3\\right]") == (
        "a\\left[0:s:3\\right]",
        ["a range with a non-numeric step"],
    )
