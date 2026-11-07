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
