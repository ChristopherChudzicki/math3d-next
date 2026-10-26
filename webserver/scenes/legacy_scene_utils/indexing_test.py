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
        ("a\\left[i\\right]", "a\\left[i-1\\right]"),
        ("a\\left[i+1\\right]", "a\\left[i\\right]"),
        ("a\\left[2i-1\\right]", "a\\left[2i-2\\right]"),
        ("a\\left[x<y\\right]", "a\\left[\\left(x<y\\right)-1\\right]"),
        ("a\\left[end\\right]", "a\\left[end-1\\right]"),
        ("a\\left[b\\left[1\\right]\\right]", "a\\left[b\\left[0\\right]-1\\right]"),
        ("a\\left[1:3\\right]", "a\\left[0:3\\right]"),
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
        # The subscript's braces go, so the bracket follows "=": an assignment.
        "P_{b=}\\left[1,2\\right]",
    ],
)
def test_leaves_brackets_that_are_not_indices(latex):
    assert shift_indices(latex) == (latex, [])


def test_reports_an_index_it_cannot_shift():
    assert shift_indices("a\\left[\\right]") == ("a\\left[\\right]", ["an empty index"])
