"""Expected math3d-next translation of each rehydrated math3d-react item.

Derived independently of the legacy translator, from the two apps' runtime
code. Citations use two roots:

- ``react:`` is ``math3d-react/client/src/`` (``react-nm:`` its ``node_modules/``)
- ``next:`` is ``math3d-next/packages/``

An expectation's ``path`` is dotted under the next item's ``properties``,
with list indices as ints. A ``NeedsEval`` may sit on a subtree path (e.g.
``expr`` when the legacy text is not a ``_f(...)=...`` assignment).
"""

from __future__ import annotations

import math
import re
from collections.abc import Callable
from dataclasses import dataclass
from fractions import Fraction
from typing import Any, Literal

Severity = Literal["render", "editor", "none"]


@dataclass(frozen=True)
class NeedsEval:
    reason: str


@dataclass(frozen=True)
class Expectation:
    path: str
    value: Any
    severity: Severity
    source: str


# Legacy properties math3d-react treats as text and never evaluates:
# description, color, label and axis have inputType 'text'
# (react:containers/MathObjects/MathGraphics/metadata.js), a grid's axes has
# no metadata entry, and a symbol's name is its assignment's left-hand side.
TEXT_SOURCES = frozenset({"description", "color", "label", "axis", "axes", "name"})


def is_math(source: str) -> bool:
    """Whether an expectation's legacy source is evaluated as an expression."""
    return not TEXT_SOURCES.intersection(source.split(","))


@dataclass(frozen=True)
class Context:
    item_id: str
    axes: dict[str, dict]
    slider_values: dict[str, Any]


LEGACY_TYPES = (
    "FOLDER",
    "VARIABLE",
    "VARIABLE_SLIDER",
    "BOOLEAN_VARIABLE",
    "CAMERA",
    "AXIS",
    "GRID",
    "POINT",
    "LINE",
    "VECTOR",
    "PARAMETRIC_CURVE",
    "PARAMETRIC_SURFACE",
    "EXPLICIT_SURFACE",
    "EXPLICIT_SURFACE_POLAR",
    "IMPLICIT_SURFACE",
    "VECTOR_FIELD",
)

# Every legacy type has a same-named next type (next:mathitem-configs/src/constants.ts:27-44).
LEGACY_TYPE_TO_NEXT_TYPE: dict[str, str] = {t: t for t in LEGACY_TYPES}


# --------------------------------------------------------------------------- #
# Value helpers
# --------------------------------------------------------------------------- #


def _js_number(x: float | Fraction) -> str:
    """JavaScript's ``Number.prototype.toString`` for a finite number."""
    if isinstance(x, Fraction):
        x = float(x)
    if isinstance(x, int):
        return str(x)
    if x == 0:
        return "0"
    if x.is_integer() and abs(x) < 1e21:
        return str(int(x))
    text = repr(x)
    # Python writes 1e-07 / 1e+21; JS writes 1e-7 / 1e+21.
    return re.sub(r"e([+-])0*(\d)", r"e\1\2", text)


def _js_str(value: Any) -> str:
    """JS template-literal stringification (``${value}``) of a JSON value."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int | float):
        return _js_number(value)
    if value is None:
        return "null"
    return str(value)


def _text(value: Any) -> Any:
    """Legacy math/text fields are LaTeX strings, copied byte-for-byte."""
    return value if isinstance(value, str) else _js_str(value)


def _bool_str(value: Any) -> str | NeedsEval:
    """Legacy real booleans become next's evaluated "true"/"false" strings."""
    if isinstance(value, bool):
        return "true" if value else "false"
    return NeedsEval(f"legacy value {value!r} is not a boolean")


def _bool(value: Any) -> bool | NeedsEval:
    if isinstance(value, bool):
        return value
    return NeedsEval(f"legacy value {value!r} is not a boolean")


_LATEX_SPACE = r"(?:\s|\\ |\\,|\\;|\\:|\\!|\\quad|\\qquad|~)"
_UNSIGNED = r"(?:\d+(?:\.\d*)?|\.\d+)"
_NUMBER = rf"[+-]?{_UNSIGNED}"


def _strip_latex_space(text: str) -> str:
    return re.sub(rf"^{_LATEX_SPACE}+|{_LATEX_SPACE}+$", "", text)


def is_blank(text: Any) -> bool:
    """Empty, or only whitespace and LaTeX spacing commands."""
    return re.sub(_LATEX_SPACE, "", _text(text) if text is not None else "") == ""


def _simple_number(text: Any) -> Fraction | None:
    """A number written as ``a``, ``a/b`` or ``\\frac{a}{b}``; else None."""
    if isinstance(text, bool):
        return None
    if isinstance(text, int | float):
        return Fraction(text)
    if not isinstance(text, str):
        return None
    s = re.sub(_LATEX_SPACE, "", text)

    def num(t: str) -> Fraction:
        return Fraction(t + "0" if t.endswith(".") else t)

    if re.fullmatch(_NUMBER, s):
        return num(s)
    m = re.fullmatch(rf"({_NUMBER})/({_UNSIGNED})", s)
    if m:
        den = num(m.group(2))
        return num(m.group(1)) / den if den else None
    m = re.fullmatch(rf"([+-]?)\\frac\{{({_UNSIGNED})\}}\{{({_UNSIGNED})\}}", s)
    if m:
        den = num(m.group(3))
        if not den:
            return None
        value = num(m.group(2)) / den
        return -value if m.group(1) == "-" else value
    return None


_FUNC_ASSIGNMENT = re.compile(
    r"^\s*(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\((?P<params>[^()]*)\)\s*=(?P<rhs>.*)$",
    re.DOTALL,
)


def _parse_func_assignment(text: Any) -> tuple[str, list[str], str] | None:
    """Split math3d-react's stored ``_f(p1, p2)=rhs`` text.

    math3d-react stores these fields as the MathInput prefix plus the user's
    LaTeX (react:containers/MathObjects/containers/MathInput/components/MathInput.js:121),
    and evaluates the whole string as a mathjs FunctionAssignmentNode
    (react:utils/mathParsing/MathExpression.js). next stores the same pieces
    as a function-assignment object (next:parser/src/interfaces.ts:29-34) and
    rebuilds ``name(params)=rhs`` (next:parser/src/MathJsParser.ts:119-130).
    """
    if not isinstance(text, str):
        return None
    m = _FUNC_ASSIGNMENT.match(text)
    if not m:
        return None
    params = [p.strip() for p in m.group("params").split(",")]
    if any(not p for p in params):
        return None
    return m.group("name"), params, m.group("rhs")


def _split_vector(text: Any) -> list[str] | None:
    """Components of a literal ``[a, b, c]`` / ``\\left[a, b, c\\right]``."""
    if not isinstance(text, str):
        return None
    s = text.strip()
    if s.startswith("\\left[") and s.endswith("\\right]"):
        inner = s[len("\\left[") : -len("\\right]")]
    elif s.startswith("[") and s.endswith("]"):
        inner = s[1:-1]
    else:
        return None
    parts: list[str] = []
    depth = 0
    start = 0
    for i, ch in enumerate(inner):
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
            if depth < 0:
                return None
        elif ch == "," and depth == 0:
            parts.append(inner[start:i])
            start = i + 1
    if depth != 0:
        return None
    parts.append(inner[start:])
    return [_strip_latex_space(p) for p in parts]


def _depends_on(rhs: str, param: str) -> bool:
    """Whether ``rhs`` mentions symbol ``param``, as mathjs would tokenize it.

    Mirrors next's preprocessing, which turns every backslash into a space
    (next:parser/src/parsers.ts:30), so ``\\theta`` is the symbol ``theta``.
    """
    name = param.lstrip("\\").strip()
    if not name:
        return False
    text = rhs.replace("\\", " ")
    pattern = rf"(?<![A-Za-z_]){re.escape(name)}(?![A-Za-z0-9_])"
    return re.search(pattern, text) is not None


# --------------------------------------------------------------------------- #
# Expectation builder
# --------------------------------------------------------------------------- #


class _Out:
    def __init__(self) -> None:
        self.items: list[Expectation] = []

    def add(self, path: str, value: Any, severity: Severity, source: str) -> None:
        self.items.append(Expectation(path, value, severity, source))

    def func_assignment(
        self, path: str, text: Any, source: str, severity: Severity = "render"
    ) -> None:
        parsed = _parse_func_assignment(text)
        if parsed is None:
            self.add(
                path,
                NeedsEval(f"{source}={text!r} is not a `name(params)=rhs` assignment"),
                severity,
                source,
            )
            return
        name, params, rhs = parsed
        self.add(f"{path}.type", "function-assignment", severity, "constant")
        self.add(f"{path}.name", name, severity, source)
        for i, param in enumerate(params):
            self.add(f"{path}.params.{i}", param, severity, source)
        self.add(f"{path}.rhs", rhs, severity, source)

    def expr_domain(self, item: dict, props: tuple[str, ...]) -> None:
        # next evaluates `domain` as an array of plain [min, max] expressions
        # (next:mathitem-configs/src/shared.ts:74-79,127-132), exactly what
        # math3d-react's range/rangeX/Y/Z fields hold
        # (react:components/MathBox/MathBoxComponents.js:737-744,1268-1274,1371-1376).
        self.add("domain.type", "array", "render", "constant")
        for i, prop in enumerate(props):
            self.add(f"domain.items.{i}.type", "expr", "render", "constant")
            self.add(f"domain.items.{i}.expr", _text(item.get(prop)), "render", prop)


def _universal(out: _Out, item: dict) -> None:
    """Fields shared by all graphics (react:containers/MathObjects/MathGraphics/metadata.js:12-40)."""
    out.add("description", _text(item.get("description")), "editor", "description")
    out.add("color", _text(item.get("color")), "render", "color")
    for prop in ("opacity", "zBias"):
        # Set verbatim on the render node (react:components/MathBox/MathBoxComponents.js:210-214).
        out.add(prop, _text(item.get(prop)), "render", prop)
    # Owner decision (2026-10-24): a blank zIndex becomes "0", MathBox's
    # default, so saved scenes say it explicitly.
    z_index = item.get("zIndex")
    out.add("zIndex", "0" if is_blank(z_index) else _text(z_index), "render", "zIndex")
    # An empty zOrder takes math3d-next's automatic order, which draws more
    # opaque graphics first, as math3d-react's zOrder = (1 - opacity)*100 did
    # (react:containers/MathBoxScene/components/MathBoxScene.js:106-110). Ties
    # follow the item tree, surfaces last
    # (next:app/src/store/scene/evaluation/useDefaultZOrder.ts).
    out.add("zOrder", "", "render", "constant")
    _visibility(out, item)


def _visibility(out: _Out, item: dict) -> None:
    # math3d-react: with useCalculatedVisibility the `visible` handler is
    # skipped and calculatedVisibility only sets the group's visibility when
    # it evaluates to a boolean or number; otherwise the group keeps MathBox's
    # default (visible) (react:components/MathBox/MathBoxComponents.js:216-228).
    # next shows `!!calculatedVisibility` whenever useCalculatedVisibility is
    # set, so an empty one hides the item
    # (next:app/src/store/scene/evaluation/mathScope.ts:102-110).
    # Policy for a blank expression: math3d-react shows the item on load, but
    # its author, who saw it hidden while editing, set `visible`; legacy scenes
    # keep the author's `visible`, and the blank expression becomes empty
    # (owner decisions, 2026-10-23 and 2026-10-24).
    use_calc = item.get("useCalculatedVisibility")
    calc = item.get("calculatedVisibility")
    calc_text = _text(calc) if calc is not None else ""
    blank = is_blank(calc)
    src = "useCalculatedVisibility"
    if use_calc is True and blank:
        out.add(
            "useCalculatedVisibility", False, "render", f"{src},calculatedVisibility"
        )
        out.add("visible", _bool(item.get("visible")), "render", "visible")
        out.add("calculatedVisibility", "", "editor", "calculatedVisibility")
    elif use_calc is True:
        out.add("useCalculatedVisibility", True, "render", src)
        out.add("visible", _bool(item.get("visible")), "editor", "visible")
        out.add("calculatedVisibility", calc_text, "render", "calculatedVisibility")
    else:
        out.add("useCalculatedVisibility", _bool(use_calc), "render", src)
        out.add("visible", _bool(item.get("visible")), "render", "visible")
        out.add(
            "calculatedVisibility",
            "" if blank else calc_text,
            "editor",
            "calculatedVisibility",
        )


def _label(out: _Out, item: dict) -> None:
    out.add("label", _text(item.get("label")), "render", "label")
    out.add(
        "labelVisible", _bool_str(item.get("labelVisible")), "render", "labelVisible"
    )


def _line_like(out: _Out, item: dict) -> None:
    # react:components/MathBox/MathBoxComponents.js:231-236
    out.add("size", _text(item.get("size")), "render", "size")
    out.add("width", _text(item.get("width")), "render", "width")
    out.add("start", _bool_str(item.get("start")), "render", "start")
    out.add("end", _bool_str(item.get("end")), "render", "end")


# --------------------------------------------------------------------------- #
# Per-type expectations
# --------------------------------------------------------------------------- #


def _folder(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    out.add("description", _text(item.get("description")), "editor", "description")
    out.add("isCollapsed", _bool_str(item.get("isCollapsed")), "editor", "isCollapsed")
    return out.items


def _variable(item: dict, ctx: Context) -> list[Expectation]:
    # math3d-react evaluates `${name}=${value}` (react:containers/MathScopeContext/selectors.js:12-15);
    # next evaluates `${lhs}=${rhs}` (next:parser/src/MathJsParser.ts:114).
    out = _Out()
    out.add("description", _text(item.get("description")), "editor", "description")
    out.add("value.type", "assignment", "render", "constant")
    out.add("value.lhs", _text(item.get("name")), "render", "name")
    out.add("value.rhs", _text(item.get("value")), "render", "value")
    return out.items


def _boolean_variable(item: dict, ctx: Context) -> list[Expectation]:
    # `${name}=${value}` with a JS boolean gives `switch=true`
    # (react:containers/MathScopeContext/selectors.js:15).
    out = _Out()
    out.add("description", _text(item.get("description")), "editor", "description")
    out.add("value.type", "assignment", "render", "constant")
    out.add("value.lhs", _text(item.get("name")), "render", "name")
    out.add("value.rhs", _bool_str(item.get("value")), "render", "value")
    return out.items


# Legacy speeds are numbers (react:containers/MathObjects/MathSymbols/VariableSlider/components/AnimationControls.js:42-54);
# next offers only these strings and plays any other at speed 1
# (next:app/src/features/editor/items/forms/VariableSlider/sliderMath.ts:11-28).
_SPEEDS: dict[Fraction, str] = {
    Fraction(1, 16): "1/16",
    Fraction(1, 8): "1/8",
    Fraction(1, 4): "1/4",
    Fraction(1, 2): "1/2",
    Fraction(3, 4): "3/4",
    Fraction(1): "1",
    Fraction(2): "2",
    Fraction(4): "4",
    Fraction(8): "8",
}


def _variable_slider(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    out.add("description", _text(item.get("description")), "editor", "description")
    out.add("value.type", "assignment", "render", "constant")
    out.add("value.lhs", _text(item.get("name")), "render", "name")
    # A null manual value means the slider's number in sliderValues is used:
    # `${name}=${sliderValues[id]}` (react:containers/MathScopeContext/selectors.js:13-14).
    # next's slider writes its number into value.rhs
    # (next:app/src/features/editor/items/forms/VariableSlider/VariableSlider.tsx:66-70,
    # next:app/src/features/editor/items/forms/VariableSlider/sliderMath.ts:76-82).
    manual = item.get("value")
    if manual is not None:
        out.add("value.rhs", _text(manual), "render", "value")
    elif ctx.item_id in ctx.slider_values:
        out.add(
            "value.rhs",
            _js_str(ctx.slider_values[ctx.item_id]),
            "render",
            "sliderValues",
        )
    else:
        out.add(
            "value.rhs",
            NeedsEval(
                "no manual value and no sliderValues entry: legacy evaluates `T=undefined`"
            ),
            "render",
            "value,sliderValues",
        )
    # Slider bounds: react:.../VariableSlider/components/VariableSlider.js:107-120;
    # next: range.items = [min, max] (next:mathitem-configs/src/items/variableSlider.ts:74-87).
    out.add("range.type", "array", "render", "constant")
    out.add("range.items.0", _text(item.get("min")), "render", "min")
    out.add("range.items.1", _text(item.get("max")), "render", "max")
    # math3d-react renders AnimationControls without fps/duration props, so its
    # defaults apply: 60 fps, a 4 s sweep at 1x
    # (react:.../VariableSlider/components/VariableSlider.js:99-104,
    # react:.../VariableSlider/components/AnimationControls.js:73-76,90-101).
    # next sweeps the range in duration/speed seconds at fps ticks/s
    # (next:app/src/features/editor/items/forms/VariableSlider/SliderAnimations.tsx:34-67,
    # next:app/src/features/editor/items/forms/VariableSlider/sliderMath.ts:73-74),
    # so while ticks keep up, fps changes only smoothness. Owner decision
    # (2026-10-23): legacy sliders keep math3d-react's effective 60.
    out.add("fps", "60", "render", "constant")
    out.add("duration", "4", "render", "constant")
    # Animation starts on mount when isAnimating
    # (react:.../VariableSlider/components/AnimationControls.js:137-141).
    out.add("isAnimating", _bool_str(item.get("isAnimating")), "render", "isAnimating")
    speed = _simple_number(item.get("speedMultiplier"))
    speed_value: str | NeedsEval
    if speed is not None and speed in _SPEEDS:
        speed_value = _SPEEDS[speed]
    elif speed is not None and speed > 0:
        # math3d-react also offered 1.5x and 3x
        # (react:.../VariableSlider/components/AnimationControls.js:42-54).
        # Owner decision (2026-10-24): take the nearest next option.
        nearest = min(_SPEEDS, key=lambda s: abs(math.log(s / speed)))
        speed_value = _SPEEDS[nearest]
    else:
        speed_value = NeedsEval(
            f"speedMultiplier={item.get('speedMultiplier')!r} has no math3d-next speed option"
        )
    out.add("speedMultiplier", speed_value, "render", "speedMultiplier")
    return out.items


# math3d-react's orthographic mode is a 50x dolly zoom
# (react:components/MathBox/MathBoxComponents.js:275,296-314).
_REACT_DOLLY = 50


def _axis_scales(ctx: Context) -> list[Fraction] | NeedsEval:
    # Each axis sets its component of the root cartesian's scale
    # (react:components/MathBox/MathBoxComponents.js:490-497); next reads the
    # same three axis scales (next:app/src/features/viewport/useAxesInfo.tsx:34-41).
    by_axis: dict[str, Any] = {}
    for axis_item in ctx.axes.values():
        by_axis[axis_item.get("axis", "x")] = axis_item.get("scale")
    scales: list[Fraction] = []
    for letter in "xyz":
        if letter not in by_axis:
            return NeedsEval(f"no legacy axis for {letter}")
        value = _simple_number(by_axis[letter])
        if value is None or value == 0:
            return NeedsEval(
                f"axis {letter} scale {by_axis[letter]!r} is not a plain number"
            )
        scales.append(value)
    return scales


def _numeric_triple(value: Any) -> list[Fraction] | None:
    if (
        isinstance(value, list)
        and len(value) == 3
        and all(isinstance(v, int | float) and not isinstance(v, bool) for v in value)
    ):
        return [Fraction(v) for v in value]
    return None


def _format_triple(values: list[Fraction]) -> str:
    return "[" + ", ".join(_js_number(v) for v in values) + "]"


def _camera(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    out.add("description", _text(item.get("description")), "editor", "description")
    # react:components/MathBox/MathBoxComponents.js:330-349 (controls flags)
    for prop in ("isOrthographic", "isPanEnabled", "isZoomEnabled", "isRotateEnabled"):
        out.add(prop, _bool_str(item.get(prop)), "render", prop)

    if item.get("useComputed") is True:
        # Computed mode places the camera at the evaluated computedPosition /
        # computedLookAt, mapped from axis coordinates into world space with
        # the cartesian range and scale
        # (react:components/MathBox/MathBoxComponents.js:368-433). next's
        # useRelative=false does the same projection
        # (next:app/src/features/viewport/Camera.tsx:47-57). The ortho dolly
        # is applied by each app on top (react:...MathBoxComponents.js:394-397,
        # next:app/src/features/viewport/Camera.tsx:94-99).
        src_p, src_t = "computedPosition,useComputed", "computedLookAt,useComputed"
        out.add("position", _text(item.get("computedPosition")), "render", src_p)
        out.add("target", _text(item.get("computedLookAt")), "render", src_t)
        out.add("useRelative", "false", "render", "useComputed")
        # Turning on useComputed in math3d-react sets rotate/zoom/pan false
        # (react:.../MathGraphics/Camera/UseComputedToggle.js:27-32), and it
        # never writes interaction back into computedPosition. next still
        # fires onEnd on every pointerup, and with updateOnDrag=true writes
        # the camera's numbers over the expressions when they differ
        # (next:app/src/features/viewport/Camera.tsx:101-122).
        out.add("updateOnDrag", "false", "render", "useComputed")
        return out.items

    # relativePosition/relativeLookAt are three.js world coordinates: the
    # share button saves camera.position and controls.target verbatim
    # (react:views/MainView/Header/containers/ShareButton/components/ShareButton.js:79-85,
    # react:services/getCameraData.js), and loading sets them straight back
    # (react:components/MathBox/MathBoxComponents.js:351-366). next's
    # useRelative=true multiplies by the axis scales
    # (next:app/src/features/viewport/Camera.tsx:55), so divide by them here.
    src_p = "relativePosition,useComputed"
    src_t = "relativeLookAt,useComputed"
    position: str | NeedsEval
    target: str | NeedsEval
    scales = _axis_scales(ctx)
    pos = _numeric_triple(item.get("relativePosition"))
    look = _numeric_triple(item.get("relativeLookAt"))
    if isinstance(scales, NeedsEval):
        position = target = scales
    elif pos is None or look is None:
        position = target = NeedsEval(
            "relativePosition/relativeLookAt is not 3 numbers"
        )
    else:
        if item.get("isOrthographic") is True:
            # In ortho mode the saved position already includes math3d-react's
            # 50x dolly, and loading re-applies only the narrowed FOV
            # (react:components/MathBox/MathBoxComponents.js:296-328, applied
            # before the deferred MathBox camera digest,
            # react-nm:mathbox/src/model/attributes.js:445-450). next dollies
            # the stored position out itself
            # (next:app/src/features/viewport/Camera.tsx:94-99,
            # next:app/src/features/viewport/dollyZoom.ts:84-88). The same
            # frustum at the target comes from storing the undollied position
            # target + (saved - target)/50.
            pos = [t + (p - t) / _REACT_DOLLY for p, t in zip(pos, look, strict=True)]
        position = _format_triple([p / s for p, s in zip(pos, scales, strict=True)])
        target = _format_triple([t / s for t, s in zip(look, scales, strict=True)])
    out.add("position", position, "render", src_p)
    out.add("target", target, "render", src_t)
    out.add("useRelative", "true", "render", "useComputed")
    # Free dragging, captured as the scene's camera on save: next's
    # updateOnDrag=true (next:app/src/features/viewport/Camera.tsx:101-122);
    # false would snap the camera back after every drag.
    out.add("updateOnDrag", "true", "render", "useComputed")
    return out.items


def _axis(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _label(out, item)
    for prop in ("min", "max", "scale", "size", "width"):
        # react:components/MathBox/MathBoxComponents.js:465-523
        out.add(prop, _text(item.get(prop)), "render", prop)
    out.add("axis", _text(item.get("axis")), "render", "axis")
    out.add(
        "ticksVisible", _bool_str(item.get("ticksVisible")), "render", "ticksVisible"
    )
    # math3d-react draws `axis()` with MathBox's defaults: end arrow on, start
    # off (react-nm:mathbox/src/primitives/types/draw/axis.js:31-34,
    # react-nm:mathbox/src/primitives/types/traits.ts:227-231), and ticks from
    # `scale({divide: 10})` (react:components/MathBox/MathBoxComponents.js:558-564).
    # next passes start/end/divisions through
    # (next:app/src/features/viewport/graphics/Axis.tsx:57-69).
    out.add("start", "false", "render", "constant")
    out.add("end", "true", "render", "constant")
    out.add("divisions", "10", "render", "constant")
    return out.items


def _grid(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    # react:components/MathBox/MathBoxComponents.js:585-608
    out.add("width", _text(item.get("width")), "render", "width")
    out.add("divisions", _text(item.get("divisions")), "render", "divisions")
    out.add("snap", _bool_str(item.get("snap")), "render", "snap")
    # Grids get `axes` from initialState (react:store/initialState.js:62-75);
    # without one MathBox's grid defaults to the xy plane.
    out.add("axes", _text(item.get("axes", "xy")), "render", "axes")
    return out.items


def _point(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _label(out, item)
    # react:components/MathBox/MathBoxComponents.js:620-635
    out.add("coords", _text(item.get("coords")), "render", "coords")
    out.add("size", _text(item.get("size")), "render", "size")
    return out.items


def _line(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _label(out, item)
    _line_like(out, item)
    out.add("coords", _text(item.get("coords")), "render", "coords")
    return out.items


def _vector(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _label(out, item)
    _line_like(out, item)
    # Drawn from tail to tail + components (react:components/MathBox/MathBoxComponents.js:708-712).
    out.add("components", _text(item.get("components")), "render", "components")
    out.add("tail", _text(item.get("tail")), "render", "tail")
    return out.items


def _parametric_curve(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _line_like(out, item)
    out.func_assignment("expr", item.get("expr"), "expr")
    out.expr_domain(item, ("range",))
    # Interval width (react:components/MathBox/MathBoxComponents.js:754-758);
    # next: next:app/src/features/viewport/graphics/ParametricCurve.tsx:63-69.
    out.add("samples1", _text(item.get("samples")), "render", "samples")
    return out.items


def _range_function(
    out: _Out, index: int, text: Any, default_param: str, source: str
) -> tuple[str, str] | None:
    """Emit domain.items.<index> from a legacy surface range.

    math3d-react stores a range that depends on the other parameter as
    `_f(p)=...` and strips that prefix otherwise
    (react:containers/MathObjects/MathGraphics/ParametricSurface/index.js:35-50,86-101,
    react:containers/MathObjects/containers/MathInput/MathInputRHS.js:57-61).
    next wants both as single-parameter function assignments
    (next:mathitem-configs/src/shared.ts:111-123).
    """
    path = f"domain.items.{index}"
    if not isinstance(text, str):
        out.add(path, NeedsEval(f"{source}={text!r} is not text"), "render", source)
        return None
    parsed = _parse_func_assignment(text)
    if parsed is not None and len(parsed[1]) == 1:
        name, (param,), rhs = parsed
    else:
        name, param, rhs = "_f", default_param, text
    out.add(f"{path}.type", "function-assignment", "render", "constant")
    out.add(f"{path}.name", name, "render", source)
    out.add(f"{path}.params.0", param, "render", source)
    out.add(f"{path}.rhs", rhs, "render", source)
    return param, rhs


def _make_surface(
    label_u: str, label_v: str
) -> Callable[[dict, Context], list[Expectation]]:
    """Parametric, explicit and polar surfaces share one renderer.

    UI labels per type: react:containers/MathObjects/MathGraphics/ParametricSurface/index.js:117-138.
    """

    def expect(item: dict, ctx: Context) -> list[Expectation]:
        out = _Out()
        _universal(out, item)
        out.add("shaded", _bool_str(item.get("shaded")), "render", "shaded")
        out.func_assignment("expr", item.get("expr"), "expr")
        out.func_assignment("colorExpr", item.get("colorExpr"), "colorExpr")
        # rangeU may depend on v and rangeV on u
        # (react:components/MathBox/MathBoxComponents.js:1091-1126). next's
        # domain is [range of 1st param as f(2nd), range of 2nd as f(1st)]
        # (next:validators/src/domainFuncs.ts:15-35).
        out.add("domain.type", "array", "render", "constant")
        first = _range_function(out, 0, item.get("rangeU"), label_v, "rangeU")
        _range_function(out, 1, item.get("rangeV"), label_u, "rangeV")
        # math3d-react always samples u along the area's width and v along its
        # height, with gridU/gridV lines at constant u/v
        # (react:components/MathBox/MathBoxComponents.js:844-889,1148-1187).
        # next puts whichever parameter it evaluates first on the width: the
        # 2nd one when the 1st one's range depends on it
        # (next:app/src/features/viewport/graphics/ParametricSurface.tsx:99-113,178-225).
        # Swap so each parameter keeps its sample and gridline counts.
        swapped = first is not None and _depends_on(first[1], first[0])
        u_src, v_src = ("vSamples", "uSamples") if swapped else ("uSamples", "vSamples")
        gu_src, gv_src = ("gridV", "gridU") if swapped else ("gridU", "gridV")
        out.add("samples1", _text(item.get(u_src)), "render", u_src)
        out.add("samples2", _text(item.get(v_src)), "render", v_src)
        out.add("grid1", _text(item.get(gu_src)), "render", gu_src)
        out.add("grid2", _text(item.get(gv_src)), "render", gv_src)
        # react:components/MathBox/MathBoxComponents.js:830-842
        out.add("gridOpacity", _text(item.get("gridOpacity")), "render", "gridOpacity")
        out.add("gridWidth", _text(item.get("gridWidth")), "render", "gridWidth")
        return out.items

    return expect


def _implicit_surface(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    out.add("shaded", _bool_str(item.get("shaded")), "render", "shaded")
    # Marching cubes over lhs - rhs = 0 (react:components/MathBox/MathBoxComponents.js:1294-1328).
    out.func_assignment("lhs", item.get("lhs"), "lhs")
    out.func_assignment("rhs", item.get("rhs"), "rhs")
    out.expr_domain(item, ("rangeX", "rangeY", "rangeZ"))
    out.add("samples", _text(item.get("samples")), "render", "samples")
    return out.items


def _vector_field(item: dict, ctx: Context) -> list[Expectation]:
    out = _Out()
    _universal(out, item)
    _line_like(out, item)
    out.expr_domain(item, ("rangeX", "rangeY", "rangeZ"))
    out.func_assignment("expr", item.get("expr"), "expr")
    out.add("scale", _text(item.get("scale")), "render", "scale")
    # One 3-vector of sample counts (react:components/MathBox/MathBoxComponents.js:1477-1491)
    # becomes three fields (next:app/src/features/viewport/graphics/VectorField.tsx:68-71).
    parts = _split_vector(item.get("samples"))
    for i in range(3):
        value: str | NeedsEval
        if parts is not None and len(parts) == 3:
            value = parts[i]
        else:
            value = NeedsEval(
                f"samples={item.get('samples')!r} is not a literal 3-vector"
            )
        out.add(f"samples{i + 1}", value, "render", "samples")
    return out.items


EXPECTATIONS: dict[str, Callable[[dict, Context], list[Expectation]]] = {
    "FOLDER": _folder,
    "VARIABLE": _variable,
    "VARIABLE_SLIDER": _variable_slider,
    "BOOLEAN_VARIABLE": _boolean_variable,
    "CAMERA": _camera,
    "AXIS": _axis,
    "GRID": _grid,
    "POINT": _point,
    "LINE": _line,
    "VECTOR": _vector,
    "PARAMETRIC_CURVE": _parametric_curve,
    "PARAMETRIC_SURFACE": _make_surface("u", "v"),
    "EXPLICIT_SURFACE": _make_surface("x", "y"),
    "EXPLICIT_SURFACE_POLAR": _make_surface("r", "\\theta"),
    "IMPLICIT_SURFACE": _implicit_surface,
    "VECTOR_FIELD": _vector_field,
}


# --------------------------------------------------------------------------- #
# Coverage of every legacy property
# --------------------------------------------------------------------------- #

_UNIVERSAL_COVERAGE = {
    "description": "description (identity)",
    "color": "color (identity)",
    "opacity": "opacity (identity); zOrder is empty, so next orders by opacity, then tree",
    "zIndex": 'zIndex (identity); blank -> "0"',
    "zBias": "zBias (identity)",
    "visible": "visible (bool); the author's value, also when useCalculatedVisibility has a blank expression",
    "useCalculatedVisibility": (
        "useCalculatedVisibility (bool); false when calculatedVisibility is blank"
    ),
    "calculatedVisibility": 'calculatedVisibility (identity); blank, including LaTeX spacing -> ""',
}
_LABEL_COVERAGE = {
    "label": "label (identity)",
    "labelVisible": 'labelVisible (bool -> "true"/"false")',
}
_LINE_COVERAGE = {
    "size": "size (identity)",
    "width": "width (identity)",
    "start": 'start (bool -> "true"/"false")',
    "end": 'end (bool -> "true"/"false")',
}
_SURFACE_COVERAGE = {
    **_UNIVERSAL_COVERAGE,
    "shaded": 'shaded (bool -> "true"/"false")',
    "expr": "expr: `_f(p1,p2)=rhs` -> function-assignment {name, params, rhs}",
    "rangeU": "domain.items.0: function of the 2nd parameter (prefix `_f(p2)=` split off if present)",
    "rangeV": "domain.items.1: function of the 1st parameter (prefix `_f(p1)=` split off if present)",
    "colorExpr": "colorExpr: `_f(X,Y,Z,p1,p2)=rhs` -> function-assignment",
    "gridOpacity": "gridOpacity (identity)",
    "gridWidth": "gridWidth (identity)",
    "uSamples": "samples1 (samples2 when rangeU depends on the 2nd parameter)",
    "vSamples": "samples2 (samples1 when rangeU depends on the 2nd parameter)",
    "gridU": "grid1 (grid2 when rangeU depends on the 2nd parameter)",
    "gridV": "grid2 (grid1 when rangeU depends on the 2nd parameter)",
}
_VOLUME_RANGES = {
    "rangeX": "domain.items.0.expr (identity)",
    "rangeY": "domain.items.1.expr (identity)",
    "rangeZ": "domain.items.2.expr (identity)",
}

COVERAGE: dict[str, dict[str, str]] = {
    "FOLDER": {
        "description": "description (identity)",
        "isCollapsed": 'isCollapsed (bool -> "true"/"false")',
        "isDropDisabled": "dropped: drag-and-drop lock of math3d-react's fixed folders; no next field",
        "isDragDisabled": "dropped: drag-and-drop lock of math3d-react's fixed folders; no next field",
    },
    "VARIABLE": {
        "name": "value.lhs (identity)",
        "value": "value.rhs (identity)",
        "description": "description (identity)",
    },
    "VARIABLE_SLIDER": {
        "name": "value.lhs (identity)",
        "value": "value.rhs (manual value; when null, sliderValues[id] as a JS number string)",
        "min": "range.items.0 (identity)",
        "max": "range.items.1 (identity)",
        "description": "description (identity)",
        "isAnimating": 'isAnimating (bool -> "true"/"false")',
        "speedMultiplier": "speedMultiplier (number -> nearest next speed on a log scale, e.g. 0.5 -> 1/2, 1.5 -> 2)",
    },
    "BOOLEAN_VARIABLE": {
        "name": "value.lhs (identity)",
        "value": 'value.rhs (bool -> "true"/"false")',
        "description": "description (identity)",
    },
    "CAMERA": {
        "description": "description (identity)",
        "useCalculatedVisibility": "dropped: cameras are not drawn; no visibility",
        "isOrthographic": 'isOrthographic (bool -> "true"/"false"); also undoes the saved 50x dolly',
        "isPanEnabled": 'isPanEnabled (bool -> "true"/"false")',
        "isZoomEnabled": 'isZoomEnabled (bool -> "true"/"false")',
        "isRotateEnabled": 'isRotateEnabled (bool -> "true"/"false")',
        "relativePosition": "position (÷ axis scales, useRelative) unless useComputed",
        "relativeLookAt": "target (÷ axis scales, useRelative) unless useComputed",
        "computedPosition": "position (identity) when useComputed; otherwise dropped (unused)",
        "computedLookAt": "target (identity) when useComputed; otherwise dropped (unused)",
        "useComputed": "useRelative = !useComputed; updateOnDrag = !useComputed",
    },
    "AXIS": {
        **_UNIVERSAL_COVERAGE,
        **_LABEL_COVERAGE,
        "min": "min (identity)",
        "max": "max (identity)",
        "axis": "axis (identity)",
        "scale": "scale (identity); also divides the camera's relative position",
        "ticksVisible": 'ticksVisible (bool -> "true"/"false")',
        "size": "size (identity)",
        "width": "width (identity)",
    },
    "GRID": {
        **_UNIVERSAL_COVERAGE,
        "width": "width (identity)",
        "divisions": "divisions (identity)",
        "snap": 'snap (bool -> "true"/"false")',
        "axes": "axes (identity; default xy)",
    },
    "POINT": {
        **_UNIVERSAL_COVERAGE,
        **_LABEL_COVERAGE,
        "coords": "coords (identity)",
        "size": "size (identity)",
    },
    "LINE": {
        **_UNIVERSAL_COVERAGE,
        **_LABEL_COVERAGE,
        **_LINE_COVERAGE,
        "coords": "coords (identity)",
    },
    "VECTOR": {
        **_UNIVERSAL_COVERAGE,
        **_LABEL_COVERAGE,
        **_LINE_COVERAGE,
        "components": "components (identity)",
        "tail": "tail (identity)",
    },
    "PARAMETRIC_CURVE": {
        **_UNIVERSAL_COVERAGE,
        **_LINE_COVERAGE,
        "expr": "expr: `_f(t)=rhs` -> function-assignment",
        "range": "domain.items.0.expr (identity)",
        "samples": "samples1 (identity)",
    },
    "PARAMETRIC_SURFACE": dict(_SURFACE_COVERAGE),
    "EXPLICIT_SURFACE": dict(_SURFACE_COVERAGE),
    "EXPLICIT_SURFACE_POLAR": dict(_SURFACE_COVERAGE),
    "IMPLICIT_SURFACE": {
        **_UNIVERSAL_COVERAGE,
        **_VOLUME_RANGES,
        "shaded": 'shaded (bool -> "true"/"false")',
        "lhs": "lhs: `_f(x,y,z)=rhs` -> function-assignment",
        "rhs": "rhs: `_f(x,y,z)=rhs` -> function-assignment",
        "samples": "samples (identity)",
    },
    "VECTOR_FIELD": {
        **_UNIVERSAL_COVERAGE,
        **_LINE_COVERAGE,
        **_VOLUME_RANGES,
        "expr": "expr: `_f(x,y,z)=rhs` -> function-assignment",
        "samples": "samples1/samples2/samples3: components of the literal 3-vector",
        "scale": "scale (identity)",
    },
}
