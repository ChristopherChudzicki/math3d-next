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

from dataclasses import dataclass
from typing import TYPE_CHECKING

from scenes.legacy_audit.evaluation import SURFACE_DOMAIN_TYPES

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

    def matches(self, pair: Pair) -> bool:
        return (
            pair.outcome == self.outcome
            and (pair.detail or "").startswith(self.detail)
            and self.item_type in (None, pair.spec.item_type)
            and self.next_field in (None, pair.spec.next_field)
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
            "realFunc's Number(...) makes a complex output NaN, which isn't drawn; "
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
            "2c samples a domain off the drawn range too; within it, math3d-next skips "
            "a complex bound's rows, and math3d-react draws the same with one complex "
            "bound but throws every frame with two, so the scene never loads; owner "
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
            "MathBox's volume rejects a non-positive count, so its voxel allocates "
            "one layer (`dims.width || 1`, etc.), as it does for math3d-next, whose "
            "validator leaves the count undefined; owner decision 2026-11-03 "
            "(tk-legacy-vector-fields-with-0-samples-in-a-directi-f57cfc)",
            "VECTOR_FIELD",
            next_field,
        )
        for next_field in ("samples1", "samples2", "samples3")
    ]
)

REPLAYS: dict[str, str] = {
    "round": "math3d-react's mathjs 3 rounds .5 toward +∞ (Math.round); mathjs 15 "
    "rounds it away from zero; owner decision 2026-11-02 "
    "(tk-pass-2-replay-known-library-convention-changes-s-6acbab)",
    "complex_add": "math3d-react's complex.js 2.0.4 adds infinities component-wise, "
    "so arg(log 0) is π; 2.4.3 makes the sum (∞, ∞), whose arg is π/4; owner "
    "decision 2026-11-02 (tk-complex-js-arg-of-the-point-at-infinity-is-4-it--61b5fe)",
}
