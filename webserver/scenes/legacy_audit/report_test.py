import pytest

from scenes.legacy_audit.compare import Comparison, SceneResult
from scenes.legacy_audit.report import Aggregate, _safe


def _result(outcome: str) -> SceneResult:
    comparison = Comparison(
        item_id="p", item_type="POINT", path="coords", source="coords",
        severity="render", outcome=outcome,
    )  # fmt: skip
    return SceneResult(key="k", times_accessed=3, comparisons=[comparison])


@pytest.mark.parametrize("outcome", ["needs_eval", "expectation_error"])
def test_unchecked_comparison_is_clean_but_not_verified(outcome):
    agg = Aggregate()
    agg.add(_result(outcome), set())
    assert (agg.clean.scenes, agg.verified_clean.scenes) == (1, 0)


def test_match_is_verified_clean():
    agg = Aggregate()
    agg.add(_result("match"), set())
    assert agg.verified_clean.scenes == 1


@pytest.mark.parametrize(
    ("value", "shown"),
    [
        ("xy", "'xy'"),
        ("#3090FF", "'#3090FF'"),
        ("my secret", "str(9)"),
        (2.5, "number"),
    ],
)
def test_safe_shows_only_constants_and_defaults(value, shown):
    assert _safe(value, {"#3090FF"}) == shown
