"""Pass 2c of the legacy-migration audit: compare both apps' evaluations.

Pairs each field math3d-react evaluated (2b, eval_react.jsonl) with its
math3d-next counterpart (2a, eval_next.jsonl) through pass 1's
expected-translation table, labels each pair, and finds root causes through
each app's `deps`. Method: docs/legacy-audit/2026-10-29-pass2-spec.md.
"""

from __future__ import annotations

import json
import math
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Any

from scenes.legacy_audit import expected

if TYPE_CHECKING:
    from scenes.legacy_audit.pass2_allowlist import Entry

MISSING = object()
OK = "ok"
# Outcomes that make a field "bad" for root finding.
BAD = frozenset({"differ", "regression", "both_error"})
SEVERITY_RANK = {"none": 0, "editor": 1, "render": 2}
# packages/legacy-audit/sample_points.json has points for arities 0 to 5.
MAX_SAMPLED_ARITY = 5

# Fields one evaluator emits that have no counterpart to compare.
KNOWN_UNPAIRED: dict[tuple[str, str], str] = {
    # math3d-next evaluates these as "true"/"false" text; math3d-react holds a
    # JS boolean it never parses. Pass 1 checks the text.
    **{
        ("next", prop): "a JS boolean in math3d-react; pass 1 checks the text"
        for prop in (
            "labelVisible",
            "ticksVisible",
            "start",
            "end",
            "shaded",
            "snap",
            "isAnimating",
            "isCollapsed",
            "isOrthographic",
            "isPanEnabled",
            "isZoomEnabled",
            "isRotateEnabled",
        )
    },
    # Constants of the translation, checked by pass 1.
    ("next", "zOrder"): "constant (empty by policy, #1010)",
    ("next", "fps"): "constant",
    ("next", "duration"): "derived from speedMultiplier",
    ("next", "useRelative"): "derived from useComputed",
    ("next", "updateOnDrag"): "derived from useComputed",
    # `AXIS.divisions` is a constant; `GRID.divisions` is paired.
    ("next", "AXIS.divisions"): "constant",
    # math3d-react evaluates a camera's computed position and look-at but
    # uses them only with useComputed (react:components/MathBox/MathBoxComponents.js:368-433).
    ("react", "CAMERA.computedPosition"): "unused unless useComputed",
    ("react", "CAMERA.computedLookAt"): "unused unless useComputed",
}


def known_unpaired(side: str, item_type: str, field_name: str) -> str | None:
    return KNOWN_UNPAIRED.get(
        (side, f"{item_type}.{field_name}"), KNOWN_UNPAIRED.get((side, field_name))
    )


# --------------------------------------------------------------------------- #
# Fingerprint comparison
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class Tolerance:
    rtol: float = 1e-6
    atol: float = 1e-9
    loose_rtol: float = 1e-3


@dataclass
class Verdict:
    outcome: str = "equal"  # equal | differ | unsure
    cause: str | None = None  # why unsure
    error: float = 0.0  # largest relative error among compared numbers
    compared: bool = False  # whether any numbers were compared
    loose: bool = True  # every difference is within the loose band

    def merge(self, other: Verdict) -> Verdict:
        rank = {"equal": 0, "unsure": 1, "differ": 2}
        if rank[other.outcome] > rank[self.outcome]:
            self.outcome, self.cause = other.outcome, other.cause
        self.error = max(self.error, other.error)
        self.compared = self.compared or other.compared
        if other.outcome == "differ":
            self.loose = self.loose and other.loose
        return self


def _is_fn(x: Any) -> bool:
    return isinstance(x, dict) and "fn" in x


def _is_number(x: Any) -> bool:
    return isinstance(x, int | float) and not isinstance(x, bool)


def _is_complex(x: Any) -> bool:
    return isinstance(x, dict) and "re" in x


def _is_error(x: Any) -> bool:
    return isinstance(x, dict) and "error" in x


def _nonfinite(x: Any) -> bool:
    """NaN, ±Infinity, or a complex with a non-finite part: one class, since
    the two mathjs versions disagree on which one a singular point gives."""
    if isinstance(x, dict) and "nonfinite" in x:
        return True
    return _is_complex(x) and not (_is_number(x["re"]) and _is_number(x["im"]))


def _as_complex(x: Any) -> tuple[float, float] | None:
    if _is_number(x):
        return (float(x), 0.0)
    if _is_complex(x) and _is_number(x["re"]) and _is_number(x["im"]):
        return (float(x["re"]), float(x["im"]))
    return None


def evidence(fp: Any) -> bool:
    """Whether a fingerprint holds any finite number."""
    if _as_complex(fp) is not None:
        return True
    if isinstance(fp, list):
        return any(evidence(x) for x in fp)
    if _is_fn(fp):
        values = list(fp["at"] or [])
        for points in (fp.get("vec") or {}).values():
            values.extend(points)
        return any(evidence(x) for x in values)
    return False


def no_evidence(fp: Any) -> bool:
    """A sampled function with a finite value at no point."""
    return _is_fn(fp) and fp["at"] is not None and not evidence(fp)


def _norm_rule(
    a: list[tuple[float, float]], b: list[tuple[float, float]], tol: Tolerance
) -> Verdict:
    # hypot, not a sum of squares, so that huge values don't overflow.
    d = math.hypot(*(c for x, y in zip(a, b) for c in (x[0] - y[0], x[1] - y[1])))
    scale = max(
        math.hypot(*(c for x in a for c in x)), math.hypot(*(c for y in b for c in y))
    )
    # The error beyond atol, so that every `equal` pair has error <= rtol.
    error = max(0.0, d - tol.atol) / scale if scale else 0.0
    if d <= tol.atol + tol.rtol * scale:
        return Verdict(error=error, compared=True)
    return Verdict(
        "differ",
        error=error,
        compared=True,
        loose=d <= tol.atol + tol.loose_rtol * scale,
    )


def _compare_points(a: list, b: list, tol: Tolerance) -> Verdict:
    v = Verdict()
    for x, y in zip(a, b, strict=True):
        if _is_error(x) and _is_error(y):
            continue
        if _is_error(x) or _is_error(y):
            v.merge(Verdict("differ", loose=False))
        else:
            v.merge(compare(x, y, tol))
    return v


def _point_sets(fp: dict) -> list[list]:
    """The scalar points, then each vector retry's."""
    vec = fp.get("vec") or {}
    return [fp["at"], *(vec[length] for length in ("2", "3") if length in vec)]


def _dense(points: list) -> bool:
    return 2 * sum(1 for x in points if evidence(x)) >= len(points)


def _compare_functions(a: dict, b: dict, tol: Tolerance) -> Verdict:
    if a["fn"] != b["fn"]:
        return Verdict("unsure", "arity")
    if a["at"] is None or b["at"] is None:
        return Verdict(
            "unsure", "unsampled" if a["fn"] > MAX_SAMPLED_ARITY else "depth"
        )
    if not evidence(a) and not evidence(b):
        return Verdict("unsure", "no_evidence")
    if a == b:
        v = Verdict(compared=True)
    else:
        v = _compare_points(a["at"], b["at"], tol)
        if a.get("vec") and b.get("vec"):
            for length in ("2", "3"):
                v.merge(_compare_points(a["vec"][length], b["vec"][length], tol))
    # A function of a 3-vector errors at every scalar point, so each point set
    # is judged on its own.
    dense = any(_dense(x) and _dense(y) for x, y in zip(_point_sets(a), _point_sets(b)))
    if v.outcome == "equal" and not dense:
        return Verdict("unsure", "sparse", v.error, v.compared)
    return v


def compare(a: Any, b: Any, tol: Tolerance) -> Verdict:
    """Compare two fingerprints (spec, "Values")."""
    if _is_fn(a) or _is_fn(b):
        if _is_fn(a) and _is_fn(b):
            return _compare_functions(a, b, tol)
        return Verdict("differ", loose=False)
    if a == b:
        return Verdict(compared=_as_complex(a) is not None or isinstance(a, list))
    if _nonfinite(a) and _nonfinite(b):
        return Verdict()
    ca, cb = _as_complex(a), _as_complex(b)
    if ca is not None and cb is not None:
        return _norm_rule([ca], [cb], tol)
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return Verdict("differ", loose=False)
        # Non-finite entries in the same places, and the norm rule for the rest.
        finite = [(_as_complex(x), _as_complex(y)) for x, y in zip(a, b)]
        if all(
            (cx is not None and cy is not None) or (_nonfinite(x) and _nonfinite(y))
            for (cx, cy), x, y in zip(finite, a, b)
        ):
            kept = [(cx, cy) for cx, cy in finite if cx is not None]
            if not kept:
                return Verdict()
            return _norm_rule([x for x, _ in kept], [y for _, y in kept], tol)  # type: ignore[misc]
        v = Verdict()
        for x, y in zip(a, b, strict=True):
            v.merge(compare(x, y, tol))
        return v
    if (isinstance(a, dict) and "other" in a) or (isinstance(b, dict) and "other" in b):
        return Verdict("unsure", "other")
    return Verdict("differ", loose=False)


def _leaves(a: Any, b: Any, out: list, errors: list) -> None:
    """Corresponding numbers of two same-shaped fingerprints, and the
    values found opposite an error."""
    if _is_fn(a) and _is_fn(b) and a["at"] and b["at"] and len(a["at"]) == len(b["at"]):
        pairs = list(zip(a["at"], b["at"]))
        if a.get("vec") and b.get("vec"):
            for length in ("2", "3"):
                pairs += list(zip(a["vec"][length], b["vec"][length]))
        for x, y in pairs:
            if _is_error(x) != _is_error(y):
                errors.append(y if _is_error(x) else x)
            else:
                _leaves(x, y, out, errors)
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for x, y in zip(a, b):
            _leaves(x, y, out, errors)
    else:
        out.append((a, b))


def signature(a: Any, b: Any, v: Verdict, tol: Tolerance) -> str:
    """What kind of difference a `differ` pair shows (spec, "Clusters")."""
    if v.loose and v.compared:
        return "loose"
    leaves: list[tuple[Any, Any]] = []
    errors: list[Any] = []
    _leaves(a, b, leaves, errors)
    # A complex value opposite a real one, or opposite NaN (realFunc's
    # Number(...) of a complex is NaN).
    opposite = set()
    for x, y in leaves:
        if compare(x, y, tol).outcome != "differ":
            continue
        for c, other in ((_as_complex(x), y), (_as_complex(y), x)):
            if c is not None and c[1] != 0:
                if _nonfinite(other):
                    opposite.add("complex_vs_nan")
                elif (o := _as_complex(other)) is not None and o[1] == 0:
                    opposite.add("complex_vs_real")
    if opposite:
        return "complex_vs_real" if "complex_vs_real" in opposite else "complex_vs_nan"
    if errors:
        return (
            "nan_vs_error" if all(_nonfinite(e) for e in errors) else "value_vs_error"
        )
    if any(
        (_nonfinite(x) and _as_complex(y) is not None)
        or (_nonfinite(y) and _as_complex(x) is not None)
        for x, y in leaves
    ):
        return "value_vs_nan"
    nums = [(x, y) for x, y in leaves if _is_number(x) and _is_number(y)]
    if nums and len(nums) == len(leaves):
        if all(x == 0 for x, _ in nums) != all(y == 0 for _, y in nums):
            return "zero_vs_value"
        if any(x or y for x, y in nums):
            if all(
                math.isclose(x, -y, rel_tol=tol.loose_rtol, abs_tol=tol.atol)
                for x, y in nums
            ):
                return "sign"
            # One pair of numbers always has a constant ratio.
            nonzero = [(x, y) for x, y in nums if abs(x) > tol.atol]
            ratios = {round(y / x, 6) for x, y in nonzero}
            if (
                len(nonzero) >= 2
                and len(ratios) == 1
                and all(abs(x) > tol.atol or abs(y) <= tol.atol for x, y in nums)
            ):
                return "scale"
        xs, ys = sorted(x for x, _ in nums), sorted(y for _, y in nums)
        if all(
            math.isclose(x, y, rel_tol=tol.rtol, abs_tol=tol.atol)
            for x, y in zip(xs, ys)
        ):
            return "permuted"
    return "other"


def shape(fp: Any) -> str:
    """A fingerprint's shape without its values, for the committed report."""
    if _is_number(fp):
        return "number"
    if _is_complex(fp):
        return "complex"
    if isinstance(fp, list):
        inner = {shape(x) for x in fp}
        return f"[{len(fp)}×{inner.pop()}]" if len(inner) == 1 else f"[{len(fp)}]"
    if _is_fn(fp):
        values = [x for x in fp["at"] or [] if not _is_error(x)]
        out = shape(values[0]) if values else "error"
        return f"fn{fp['fn']}→{out}"
    if isinstance(fp, dict) and fp:
        return next(iter(fp))
    return type(fp).__name__


def truthy(fp: Any) -> bool | None:
    """JavaScript `!!value` of an evaluated value, where it is defined."""
    if isinstance(fp, dict):
        if "bool" in fp:
            return fp["bool"]
        if "nonfinite" in fp:
            return fp["nonfinite"] != "NaN"
        if "undefined" in fp:
            return False
        if "str" in fp:
            return bool(fp["str"])
        if "re" in fp or "fn" in fp:
            return True
        return None
    if _is_number(fp):
        return fp != 0
    if isinstance(fp, list):
        return True
    return None


# --------------------------------------------------------------------------- #
# Message templates
# --------------------------------------------------------------------------- #

_FUNCTION_NAMES = frozenset(
    json.loads((Path(__file__).parent / "fixtures" / "function_names.json").read_text())
)
_IDENT = r"(?:[^\W\d]|\$)[\w$]*"
_NUMBER = re.compile(r"\d+(?:\.\d+)?(?:e[+-]?\d+)?")
_TOKEN = re.compile(rf"{_IDENT}|{_NUMBER.pattern}")
_NAMES_AFTER = re.compile(
    r"(Undefined (?:function|symbols?)|Depends on undefined symbol\(s\)|"
    r"Duplicate symbol name|Error evaluating|missing in provided namespace|"
    r"in function|Function|assigned multiple times:?|cyclic dependencies:?)\s+"
    rf"({_IDENT}(?:\s*,\s*{_IDENT})*)",
    re.IGNORECASE,
)
_NAME_BEFORE = re.compile(
    r"(?<!\S)\S+(?=\s+(?:has been assigned|contains a unit|"
    r"has cyclic dependencies|is not a function))",
    re.IGNORECASE,
)


def template(message: str | None) -> str:
    """An error message with user values removed: numbers, quoted text, and
    names that aren't functions of either app's mathjs."""
    if not message:
        return ""
    # An apostrophe inside a word ("doesn't") doesn't open a quote.
    text = re.sub(r"(?<!\w)'[^']*'|\"[^\"]*\"|`[^`]*`", "'…'", message)
    # Digits in a name too (E16 in a coordinate), unless it's a function's (log10).
    text = _TOKEN.sub(
        lambda m: m[0] if m[0] in _FUNCTION_NAMES else _NUMBER.sub("N", m[0]), text
    )

    def names(m: re.Match) -> str:
        kept = [
            n if n in _FUNCTION_NAMES else "X" for n in re.split(r"\s*,\s*", m.group(2))
        ]
        return f"{m.group(1)} {', '.join(dict.fromkeys(kept))}"

    text = _NAMES_AFTER.sub(names, text)
    text = _NAME_BEFORE.sub(
        lambda m: m[0] if m[0] in _FUNCTION_NAMES or m[0] == "'…'" else "X", text
    )
    text = re.sub(r"(its value is:).*", r"\1 …", text, flags=re.DOTALL)
    # Anything left that looks like LaTeX or an expression is user text.
    text = re.sub(
        r"\\[A-Za-z]+|[^\W\d]\w*\([^)]*\)",
        lambda m: m[0] if m[0] == "symbol(s)" else "…",
        text,
    )
    return text[:120]


# --------------------------------------------------------------------------- #
# Pairing
# --------------------------------------------------------------------------- #


@dataclass
class PairSpec:
    item_id: str
    item_type: str
    legacy_field: str
    legacy_element: int | None
    next_field: str
    next_element: int | None
    severity: str
    rule: str = "value"  # value | domain | coords | truthiness | camera
    expected: Any = None  # the camera rule's expected numbers


@dataclass
class Pairing:
    pairs: list[PairSpec] = field(default_factory=list)
    # (side, item type, field, reason)
    unpaired: list[tuple[str, str, str, str]] = field(default_factory=list)


def _next_location(path: str) -> tuple[str, int | None]:
    parts = path.split(".")
    if len(parts) > 2 and parts[1] == "items" and parts[2].isdigit():
        return parts[0], int(parts[2])
    return parts[0], None


def _legacy_field(source: str) -> str:
    first = source.split(",")[0]
    # A slider without a manual value evaluates `${name}=${sliderValues[id]}`.
    return "value" if first == "sliderValues" else first


def _rule(item_type: str, legacy_field: str, next_field: str) -> str:
    if next_field == "domain" and item_type in (
        "PARAMETRIC_SURFACE",
        "EXPLICIT_SURFACE",
        "EXPLICIT_SURFACE_POLAR",
    ):
        return "domain"
    if item_type == "POINT" and next_field == "coords":
        return "coords"
    if next_field == "calculatedVisibility":
        return "truthiness"
    return "value"


def _parse_triple(text: str) -> list[float] | None:
    parts = expected._split_vector(text)
    try:
        return [float(p) for p in parts] if parts and len(parts) == 3 else None
    except ValueError:
        return None


def _camera_pairs(
    out: Pairing,
    item_id: str,
    item: dict,
    rehydrated: dict,
    react_items: dict,
    next_fields: dict,
    used: set,
) -> None:
    """A camera without useComputed: math3d-next's evaluated position and
    target against pass 1's expected numbers, recomputed with the axis scales
    math3d-react evaluated (`?? 1` when one fails, as useAxesInfo does)."""
    axes = {}
    for axis_id, axis in rehydrated["mathGraphics"].items():
        if not axis_id.startswith("axis-"):
            continue
        scale = (react_items.get(axis_id) or {}).get("scale") or {}
        value = scale.get("value") if scale.get("status") == OK else None
        axes[axis_id] = {**axis, "scale": value if _is_number(value) else 1}
    ctx = expected.Context(item_id=item_id, axes=axes, slider_values={})
    for exp in expected.EXPECTATIONS["CAMERA"](item, ctx):
        if exp.path not in ("position", "target") or exp.path not in next_fields:
            continue
        used.add(("next", exp.path))
        numbers = (
            None
            if isinstance(exp.value, expected.NeedsEval)
            else _parse_triple(exp.value)
        )
        if numbers is None:
            out.unpaired.append(
                ("next", "CAMERA", exp.path, "camera position not computable")
            )
            continue
        out.pairs.append(
            PairSpec(
                item_id,
                "CAMERA",
                _legacy_field(exp.source),
                None,
                exp.path,
                None,
                exp.severity,
                "camera",
                numbers,
            )
        )


def pair_scene(
    rehydrated: dict, react_items: dict, next_items: dict, next_types: dict[str, str]
) -> Pairing:
    """Pair the fields both evaluators emitted for one scene (spec, "Pairing")."""
    out = Pairing()
    graphics = rehydrated.get("mathGraphics") or {}
    legacy = {**graphics, **(rehydrated.get("mathSymbols") or {})}
    slider_values = rehydrated.get("sliderValues") or {}
    axes = {k: v for k, v in graphics.items() if k.startswith("axis-")}
    for item_id, item in legacy.items():
        item_type = item["type"]
        react_fields = react_items.get(item_id) or {}
        next_fields = next_items.get(item_id) or {}
        used: set[tuple[str, str]] = set()
        reasons: dict[tuple[str, str], str] = {}
        ctx = expected.Context(item_id=item_id, axes=axes, slider_values=slider_values)
        try:
            expectations = expected.EXPECTATIONS[item_type](item, ctx)
        except Exception:  # noqa: BLE001 — pass 1 counts these
            expectations = []
            for f in react_fields:
                reasons[("react", f)] = "expectation_error"
            for f in next_fields:
                reasons[("next", f)] = "expectation_error"
        camera_rule = item_type == "CAMERA" and item.get("useComputed") is not True
        if camera_rule:
            _camera_pairs(
                out, item_id, item, rehydrated, react_items, next_fields, used
            )
        groups: dict[tuple, str] = {}
        for exp in expectations:
            if exp.source == "constant" or not expected.is_math(exp.source):
                continue
            lf = _legacy_field(exp.source)
            nf, ne = _next_location(exp.path)
            if camera_rule and nf in ("position", "target"):
                continue
            le = (
                int(nf[len("samples") :]) - 1
                if item_type == "VECTOR_FIELD"
                and lf == "samples"
                and nf.startswith("samples")
                else None
            )
            if lf not in react_fields or nf not in next_fields:
                continue
            text_from_slider = "sliderValues" in exp.source
            if not text_from_slider and expected.is_blank(item.get(lf)):
                reasons.setdefault(("react", lf), "blank")
                reasons.setdefault(("next", nf), "blank")
                continue
            key = (lf, le, nf, ne)
            if SEVERITY_RANK[exp.severity] >= SEVERITY_RANK[groups.get(key, "none")]:
                groups[key] = exp.severity
        for (lf, le, nf, ne), severity in groups.items():
            used.update({("react", lf), ("next", nf)})
            out.pairs.append(
                PairSpec(
                    item_id,
                    item_type,
                    lf,
                    le,
                    nf,
                    ne,
                    severity,
                    _rule(item_type, lf, nf),
                )
            )
        for side, fields, other in (
            ("react", react_fields, next_fields),
            ("next", next_fields, react_fields),
        ):
            for f in fields:
                if (side, f) in used:
                    continue
                known = known_unpaired(side, item_type, f)
                if known:
                    reason = f"known: {known}"
                elif (side, f) in reasons:
                    reason = reasons[(side, f)]
                elif not other:
                    reason = "item missing in the other app"
                else:
                    reason = "unaccounted"
                out.unpaired.append((side, item_type, f, reason))
    for item_id, fields in next_items.items():
        if item_id in legacy:
            continue
        item_type = next_types.get(item_id, "?")
        for f in fields:
            known = known_unpaired("next", item_type, f)
            reason = f"known: {known}" if known else "item only in math3d-next"
            out.unpaired.append(("next", item_type, f, reason))
    return out


# --------------------------------------------------------------------------- #
# Labels
# --------------------------------------------------------------------------- #


@dataclass
class Side:
    status: str
    value: Any = MISSING
    message: str | None = None


@dataclass
class Pair:
    spec: PairSpec
    legacy: Side
    next: Side
    outcome: str
    detail: str | None = None  # unsure cause, differ signature, or error template
    verdict: Verdict | None = None
    features: list[str] = field(default_factory=list)
    root: bool = False
    allowlisted: str | None = None


def _side(record: dict, element: int | None, per_element_status: bool) -> Side:
    """One field, or one element of it, from an evaluator's output. 2a records
    each element's status separately; 2b has only the field's."""
    status, message = record["status"], record.get("message")
    value = record.get("value", MISSING)
    if element is None:
        return Side(status, value, message)
    if per_element_status and "elements" in record:
        if element >= len(record["elements"]):
            if status != OK:
                return Side(status, MISSING, message)
            return Side("eval", MISSING, "no such element")
        el = record["elements"][element]
        # An element can be ok without a value when a sibling element failed
        # and the field has no value as a whole; label() calls it `sibling`.
        el_value = (
            value[element]
            if isinstance(value, list) and element < len(value)
            else MISSING
        )
        return Side(el["status"], el_value, el.get("message", message))
    if status != OK:
        return Side(status, MISSING, message)
    if isinstance(value, list) and element < len(value):
        return Side(OK, value[element])
    return Side("eval", MISSING, "no such element")


def _compare_by_rule(spec: PairSpec, a: Any, b: Any, tol: Tolerance) -> Verdict:
    if (
        spec.rule == "domain"
        and isinstance(a, list)
        and _is_fn(b)
        and b["at"] is not None
    ):
        # A legacy range that doesn't depend on the other parameter is an array;
        # math3d-next's is always a function of it.
        return _compare_points([a] * len(b["at"]), b["at"], tol)
    if spec.rule == "coords":
        # math3d-next validates a point's coords as one or many points
        # (next:mathitem-configs/src/items/point.ts), so one point is [[x, y, z]].
        single = isinstance(b, list) and len(b) == 1 and isinstance(b[0], list)
        flat = isinstance(a, list) and not any(isinstance(x, list) for x in a)
        if single and flat:
            return compare(a, b[0], tol)
    if spec.rule == "truthiness":
        ta, tb = truthy(a), truthy(b)
        if ta is not None and tb is not None:
            return Verdict() if ta == tb else Verdict("differ", loose=False)
    return compare(a, b, tol)


def label(spec: PairSpec, legacy: Side, nxt: Side, tol: Tolerance) -> Pair:
    """Apply the status table, then compare values (spec, "Comparison")."""
    l_ok, n_ok = legacy.status == OK, nxt.status == OK
    # No evidence: a function finite at no point is an error opposite an error.
    if l_ok and not n_ok and no_evidence(legacy.value):
        l_ok = False
        legacy = Side("eval", legacy.value, "no finite value at any sample point")
    if n_ok and not l_ok and no_evidence(nxt.value):
        n_ok = False
        nxt = Side("eval", nxt.value, "no finite value at any sample point")
    if l_ok and n_ok:
        if nxt.value is MISSING:
            return Pair(spec, legacy, nxt, "unsure", "sibling")
        v = _compare_by_rule(spec, legacy.value, nxt.value, tol)
        if v.outcome == "differ":
            return Pair(
                spec,
                legacy,
                nxt,
                "differ",
                signature(legacy.value, nxt.value, v, tol),
                v,
            )
        return Pair(spec, legacy, nxt, v.outcome, v.cause, v)
    if l_ok:
        return Pair(
            spec, legacy, nxt, "regression", f"{nxt.status}: {template(nxt.message)}"
        )
    if n_ok:
        return Pair(
            spec,
            legacy,
            nxt,
            "next_only_ok",
            f"{legacy.status}: {template(legacy.message)}",
        )
    return Pair(
        spec, legacy, nxt, "both_error", f"{nxt.status}: {template(nxt.message)}"
    )


# --------------------------------------------------------------------------- #
# Roots
# --------------------------------------------------------------------------- #


def _reach(
    graph: dict[str, list[str]], start: str, cache: dict[str, frozenset[str]]
) -> frozenset[str]:
    if start in cache:
        return cache[start]
    seen: set[str] = set()
    stack = list(graph.get(start, ()))
    while stack:
        node = stack.pop()
        if node not in seen:
            seen.add(node)
            stack.extend(graph.get(node, ()))
    cache[start] = frozenset(seen)
    return cache[start]


def mark_roots(pairs: list[Pair], react_items: dict, next_items: dict) -> None:
    """A bad pair is a root unless a field it depends on, outside its own
    dependency cycle, is bad too (spec, "Roots")."""
    graphs: dict[str, dict[str, list[str]]] = {"react": {}, "next": {}}
    bad: dict[str, set[str]] = {"react": set(), "next": set()}
    for side, items in (("react", react_items), ("next", next_items)):
        for item_id, fields in items.items():
            for name, record in fields.items():
                fid = f"{item_id}-{name}"
                graphs[side][fid] = record.get("deps", [])
                if record["status"] != OK:
                    bad[side].add(fid)
    for p in pairs:
        if p.outcome in BAD:
            bad["react"].add(f"{p.spec.item_id}-{p.spec.legacy_field}")
            bad["next"].add(f"{p.spec.item_id}-{p.spec.next_field}")
    caches: dict[str, dict] = {"react": {}, "next": {}}
    for p in pairs:
        if p.outcome not in BAD:
            continue
        downstream = False
        for side, fid in (
            ("react", f"{p.spec.item_id}-{p.spec.legacy_field}"),
            ("next", f"{p.spec.item_id}-{p.spec.next_field}"),
        ):
            g, cache = graphs[side], caches[side]
            for dep in _reach(g, fid, cache):
                if dep in bad[side] and dep != fid and fid not in _reach(g, dep, cache):
                    downstream = True
                    break
            if downstream:
                break
        p.root = not downstream


# --------------------------------------------------------------------------- #
# Scenes
# --------------------------------------------------------------------------- #


@dataclass
class SceneResult:
    key: str
    times_accessed: int
    excluded: str | None = None  # why the scene isn't judged
    crash: str | None = None  # math3d-next's evaluator crashed
    pairs: list[Pair] = field(default_factory=list)
    unpaired: list[tuple[str, str, str, str]] = field(default_factory=list)


def evaluate_scene(
    exported: dict,
    rehydrated: dict,
    react_eval: dict,
    next_eval: dict,
    tol: Tolerance,
    allowlist: Sequence[Entry] = (),
    replays: Mapping[str, dict] | None = None,
) -> SceneResult:
    """Pair, label and find roots for one scene. The four inputs are one line
    each of legacy.jsonl, rehydrated.jsonl, eval_react.jsonl and
    eval_next.jsonl; `replays` maps a convention's reason to this scene's line
    of its replay, when the replay evaluated it."""
    key = exported["key"]
    assert rehydrated["key"] == react_eval["key"] == next_eval["key"] == key, (
        "input files are out of step"
    )
    result = SceneResult(key, exported["times_accessed"])
    if rehydrated.get("legacy_broken"):
        result.excluded = "legacy_broken"
        return result
    if react_eval["crashed"]:
        result.excluded = "math3d-react evaluator crashed"
        return result
    if next_eval["crashed"]:
        result.crash = template(next_eval["crashed"])
        return result
    react_items, next_items = react_eval["items"], next_eval["items"]
    next_types = {i["id"]: i["type"] for i in exported["migrated"]["items"]}
    pairing = pair_scene(rehydrated, react_items, next_items, next_types)
    result.unpaired = pairing.unpaired
    for spec in pairing.pairs:
        next_record = next_items[spec.item_id][spec.next_field]
        if spec.rule == "camera":
            legacy = Side(OK, spec.expected)
        else:
            legacy_record = react_items[spec.item_id][spec.legacy_field]
            legacy = _side(legacy_record, spec.legacy_element, False)
        nxt = _side(next_record, spec.next_element, True)
        pair = label(spec, legacy, nxt, tol)
        pair.features = next_record.get("features", [])
        result.pairs.append(pair)
    mark_roots(result.pairs, react_items, next_items)
    for pair in result.pairs:
        if pair.root:
            pair.allowlisted = allowlisted(pair, allowlist) or replayed(
                pair, replays or {}, tol
            )
    return result


def allowlisted(pair: Pair, allowlist: Sequence[Entry]) -> str | None:
    for entry in allowlist:
        if entry.matches(pair):
            return entry.reason
    return None


def replayed(pair: Pair, replays: Mapping[str, dict], tol: Tolerance) -> str | None:
    """The reason of the first replay that turns a `differ` pair `equal`."""
    if pair.outcome != "differ":
        return None
    s = pair.spec
    for reason, record in replays.items():
        field_record = record["items"].get(s.item_id, {}).get(s.next_field)
        if field_record is None:
            continue
        replayed_side = _side(field_record, s.next_element, True)
        if label(s, pair.legacy, replayed_side, tol).outcome == "equal":
            return reason
    return None


def cluster_key(pair: Pair) -> str:
    s = pair.spec
    return f"{s.item_type}|{s.next_field}|{pair.outcome}|{pair.detail}"
