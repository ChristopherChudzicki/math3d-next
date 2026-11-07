"""Accepted pass-2 differences.

Each entry matches root `differ` or `regression` pairs and cites the app code
or owner decision that makes the difference acceptable. Matching pairs are
reported apart and don't make a scene unclean; their dependents inherit the
entry by not being roots.

`REPLAYS` accepts a root `differ` pair when math3d-next, re-evaluated with one
math3d-react convention swapped in (packages/legacy-audit `CONVENTIONS`),
gives math3d-react's value: that convention is the whole difference.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from scenes.legacy_audit.evaluation import SURFACE_DOMAIN_TYPES, _is_complex

if TYPE_CHECKING:
    from scenes.legacy_audit.evaluation import Pair


@dataclass(frozen=True)
class Entry:
    outcome: str
    # A prefix of the pair's detail: its differ signature, or its error
    # template ("eval: Undefined function X").
    detail: str
    reason: str
    item_type: str | None = None
    next_field: str | None = None
    legacy_value: Callable[[Any], bool] | None = None

    def matches(self, pair: Pair) -> bool:
        return (
            pair.outcome == self.outcome
            and (pair.detail or "").startswith(self.detail)
            and self.item_type in (None, pair.spec.item_type)
            and self.next_field in (None, pair.spec.next_field)
            and (self.legacy_value is None or self.legacy_value(pair.legacy.value))
        )


def _one_nonreal_vector(value: Any) -> bool:
    """One 3-vector with a NaN or non-real complex component."""
    return (
        isinstance(value, list)
        and len(value) == 3
        and not any(isinstance(x, list) for x in value)
        and any(
            x == {"nonfinite": "NaN"} or (_is_complex(x) and x["im"] != 0)
            for x in value
        )
    )


# Fields math3d-next validates with realFunc (next:validators/src/validators.ts),
# from next:mathitem-configs/src/items.
_REAL_FUNC_FIELDS = [
    ("PARAMETRIC_CURVE", "expr"),
    ("PARAMETRIC_SURFACE", "expr"),
    ("PARAMETRIC_SURFACE", "colorExpr"),
    ("EXPLICIT_SURFACE", "expr"),
    ("EXPLICIT_SURFACE", "colorExpr"),
    ("EXPLICIT_SURFACE_POLAR", "expr"),
    ("EXPLICIT_SURFACE_POLAR", "colorExpr"),
    ("IMPLICIT_SURFACE", "lhs"),
    ("IMPLICIT_SURFACE", "rhs"),
    ("VECTOR_FIELD", "expr"),
]

ALLOWLIST: list[Entry] = (
    [
        Entry(
            "differ",
            "complex_vs_nan",
            "`realFunc`'s `Number(...)` makes a complex output `NaN`, which isn't "
            "drawn; "
            "owner decision 2026-11-01 (tk-math3d-next-realfunc-turns-a-complex-output-into-0f7f11)",
            item_type,
            next_field,
        )
        for item_type, next_field in _REAL_FUNC_FIELDS
    ]
    + [
        Entry(
            "differ",
            "complex_vs_nan",
            "Most differing samples fall outside the drawn range. Within it, "
            "math3d-next skips rows where a bound is complex; math3d-react does the "
            "same with one complex bound, and with two throws every frame and never "
            "loads the scene; owner "
            "decision 2026-11-03 (tk-legacy-complex-surface-domains-complex-in-react--ce1718)",
            item_type,
            "domain",
        )
        for item_type in SURFACE_DOMAIN_TYPES
    ]
    + [
        Entry(
            "regression",
            "validate: this must be a positive number",
            "Both apps draw one layer: MathBox's volume rejects a count of 0, which "
            "leaves it unset, and its voxel allocates `dims.width || 1` etc.; "
            "math3d-next's validator leaves the count undefined; owner decision "
            "2026-11-03 "
            "(tk-legacy-vector-fields-with-0-samples-in-a-directi-f57cfc)",
            "VECTOR_FIELD",
            next_field,
        )
        for next_field in ("samples1", "samples2", "samples3")
    ]
    + [
        Entry(
            "differ",
            "zero_vs_value",
            "math3d-next rejects a 0 axis scale, since it divides camera coordinates "
            "by it (next:app/src/features/viewport/shared/coordinates.ts), so the "
            "translator makes it "
            "1/1024: flat to the eye; owner decision 2026-11-03 "
            "(tk-legacy-scenes-with-an-axis-scale-of-0-show-the-p-7fea41)",
            "AXIS",
            "scale",
        )
    ]
    + [
        Entry(
            "regression",
            "validate: this tuple value has too ",
            "math3d-react passes any length to a 3-channel MathBox array, which reads "
            "the list in threes; math3d-next's error for coords that aren't 3 numbers "
            "is the more accurate behaviour; owner decision 2026-11-05 "
            "(tk-legacy-points-whose-coords-aren-t-3-numbers-acce-53723e)",
            "POINT",
            "coords",
        )
    ]
    + [
        Entry(
            "regression",
            "validate: ",
            "Neither app draws it: math3d-react draws nothing at a NaN position, and "
            "a complex entry becomes NaN in a point's MathBox array or fails a "
            "vector's `validateVector`; "
            "math3d-next rejects it and draws nothing "
            "(next:app/src/features/viewport/mathbox/graphics); owner decision "
            "2026-11-07 (tk-legacy-points-vectors-with-nan-or-complex-coordi-343596)",
            item_type,
            next_field,
            _one_nonreal_vector,
        )
        for item_type, next_field in (
            ("POINT", "coords"),
            ("VECTOR", "components"),
            ("VECTOR", "tail"),
        )
    ]
)

REPLAYS: dict[str, str] = {
    "round": "math3d-react's mathjs 3 rounds .5 toward +∞ (`Math.round`); mathjs 15 "
    "rounds it away from zero; owner decision 2026-11-02 "
    "(tk-pass-2-replay-known-library-convention-changes-s-6acbab)",
    "complex_add": "math3d-react's complex.js 2.0.4 adds infinities component-wise, "
    "so `arg(log 0)` is π; 2.4.3 makes the sum (∞, ∞), whose `arg` is π/4; owner "
    "decision 2026-11-02 (tk-complex-js-arg-of-the-point-at-infinity-is-4-it--61b5fe)",
}
