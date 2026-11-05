import pytest

from scenes.legacy_audit.evaluation import OK, Side, label
from scenes.legacy_audit.evaluation_test import NAN, TOL, spec
from scenes.legacy_audit.pass2_allowlist import ALLOWLIST

REJECTED = Side(
    "validate",
    message="[1] must be a `number` type, but the final value was: `NaN`.",
)


@pytest.mark.parametrize(
    ("legacy", "allowlisted"),
    [
        ([0, NAN, 0], True),
        ([0, {"re": 1, "im": 2}, 0], True),
        ([1, 2, 3], False),
        # math3d-react draws the real points of a list.
        ([[0, NAN, 0], [1, 2, 3]], False),
    ],
)
def test_only_a_lone_point_with_a_nonreal_coordinate_is_allowlisted(
    legacy, allowlisted
):
    pair = label(
        spec(item_type="POINT", next_field="coords"), Side(OK, legacy), REJECTED, TOL
    )
    assert pair.outcome == "regression"
    assert any(entry.matches(pair) for entry in ALLOWLIST) == allowlisted


@pytest.mark.parametrize(
    ("legacy", "next_", "allowlisted"),
    [
        ([[-5, 5], [-5, 5], [5, 1]], [[-5, 5], [-5, 5], [5, 5]], True),
        # The last bound, not the first: not the translator's flattening.
        ([[-5, 5], [-5, 5], [5, 1]], [[-5, 5], [-5, 5], [1, 1]], False),
    ],
)
def test_only_a_vector_field_range_flattened_to_its_first_bound_is_allowlisted(
    legacy, next_, allowlisted
):
    pair = label(
        spec(item_type="VECTOR_FIELD", next_field="domain"),
        Side(OK, legacy),
        Side(OK, next_),
        TOL,
    )
    assert pair.outcome == "differ"
    assert any(entry.matches(pair) for entry in ALLOWLIST) == allowlisted


def test_a_vector_field_zero_count_written_as_one_is_allowlisted():
    pair = label(
        spec(item_type="VECTOR_FIELD", next_field="samples3"),
        Side(OK, 0),
        Side(OK, 1),
        TOL,
    )
    assert any(entry.matches(pair) for entry in ALLOWLIST)
