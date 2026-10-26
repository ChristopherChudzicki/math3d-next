"""Equivalences the legacy audit accepts between an expected and an actual value.

Each one is reported under its own name, so a normalization can never hide a
difference silently: a reader sees how many comparisons needed it.
"""

import math
import re
from typing import Any

from scenes.legacy_scene_utils.indexing import shift_indices

# LaTeX whitespace: "\ " (explicit space) and plain spaces. math3d-next's
# parser can treat a space as a token separator (`x y` vs `xy`), so this can
# mask a real difference; check its count in the report.
_LATEX_SPACE = re.compile(r"\\ |\s+")
_NUMBER = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
_VECTOR = re.compile(
    rf"^\s*(?:\\left)?\[\s*({_NUMBER}(?:\s*,\s*{_NUMBER})*)\s*(?:\\right)?\]\s*$"
)
REL_TOL = 1e-9
ABS_TOL = 1e-9


def _latex_compact(value: str) -> str:
    return _LATEX_SPACE.sub("", value)


def _as_number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def _as_vector(value: Any) -> list[float] | None:
    if isinstance(value, list) and all(_as_number(v) is not None for v in value):
        return [float(v) for v in value]
    if isinstance(value, str):
        match = _VECTOR.match(value)
        if match:
            return [float(v) for v in match[1].split(",")]
    return None


def _close(a: float, b: float) -> bool:
    return math.isclose(a, b, rel_tol=REL_TOL, abs_tol=ABS_TOL)


def equivalence(expected: Any, actual: Any) -> str | None:
    """Return "exact", the name of the normalization that equates the two
    values, or None if they differ."""
    if expected == actual and type(expected) is type(actual):
        return "exact"
    if isinstance(expected, bool) or isinstance(actual, bool):
        return None
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            return None
        kinds = [equivalence(e, a) for e, a in zip(expected, actual, strict=True)]
        if None in kinds:
            return None
        named = sorted({k for k in kinds if k and k != "exact"})
        return named[0] if named else "exact"
    expected_number, actual_number = _as_number(expected), _as_number(actual)
    if expected_number is not None and actual_number is not None:
        if type(expected) is not type(actual) and _close(
            expected_number, actual_number
        ):
            return "number_vs_string"
        if _close(expected_number, actual_number):
            return "numeric_tolerance"
        return None
    if isinstance(expected, str) and isinstance(actual, str):
        if _latex_compact(expected) == _latex_compact(actual):
            return "latex_whitespace"
        # math3d-next indexes arrays from 0 (owner decision, 2026-10-24). This
        # is the translator's own shift, so it is checked separately, against
        # math3d-next's parser: packages/parser/src/legacyAudit/.
        if _latex_compact(shift_indices(expected)[0]) == _latex_compact(actual):
            return "index_shift"
        expected_vector, actual_vector = _as_vector(expected), _as_vector(actual)
        if (
            expected_vector is not None
            and actual_vector is not None
            and len(expected_vector) == len(actual_vector)
            and all(
                _close(e, a)
                for e, a in zip(expected_vector, actual_vector, strict=True)
            )
        ):
            return "numeric_tolerance"
    return None
