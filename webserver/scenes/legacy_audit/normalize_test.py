import pytest

from scenes.legacy_audit.normalize import equivalence


@pytest.mark.parametrize(
    ("expected", "actual", "kind"),
    [
        ("x^2", "x^2", "exact"),
        ("\\left[-2,\\ 2\\right]", "\\left[-2, 2\\right]", "latex_whitespace"),
        ("a\\left[1\\right]", "a\\left[0\\right]", "index_shift"),
        ("1", 1, "number_vs_string"),
        ("[0.5, -2.0, 0.5]", "[0.5000000000001, -2, 0.5]", "numeric_tolerance"),
        (["x", "y"], ["x", "y"], "exact"),
    ],
)
def test_equivalent_values(expected, actual, kind):
    assert equivalence(expected, actual) == kind


@pytest.mark.parametrize(
    ("expected", "actual"),
    [
        ("x^2", "x^3"),
        ("[0, -2, 0.5]", "[0.5, -2, 0.5]"),
        ("xy", "yz"),
        ("a\\left[2\\right]", "a\\left[0\\right]"),
        (True, "true"),
        (False, 0),
        (["u", "v"], ["v", "u"]),
    ],
)
def test_different_values(expected, actual):
    assert equivalence(expected, actual) is None
