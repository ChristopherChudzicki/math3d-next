import dataclasses
import math
import re
from collections.abc import Callable
from copy import deepcopy
from fractions import Fraction
from typing import Literal, cast

import scenes.legacy_scene_utils.legacy_data as old
from scenes.legacy_scene_utils import operators, pdiff
from scenes.legacy_scene_utils.color_expr import translate_color_expr
from scenes.legacy_scene_utils.issue_log import IssueLog
from scenes.legacy_scene_utils.symbols import depends_on
from scenes.schemas.math_items import (
    AssignmentObj,
    AxisItem,
    AxisProperties,
    BooleanVariableItem,
    BooleanVariableProperties,
    CameraItem,
    CameraProperties,
    ExplicitSurfaceItem,
    ExplicitSurfacePolarItem,
    ExplicitSurfacePolarProperties,
    ExplicitSurfaceProperties,
    ExprArray,
    ExprObj,
    FolderItem,
    FolderProperties,
    FunctionAssignmentArray,
    FunctionAssignmentObj,
    GridItem,
    GridProperties,
    ImplicitSurfaceItem,
    ImplicitSurfaceProperties,
    LineItem,
    LineProperties,
    MathItemUnion,
    ParametricCurveItem,
    ParametricCurveProperties,
    ParametricSurfaceItem,
    ParametricSurfaceProperties,
    PointItem,
    PointProperties,
    StrArray,
    VariableItem,
    VariableProperties,
    VariableSliderItem,
    VariableSliderProperties,
    VectorFieldItem,
    VectorFieldProperties,
    VectorItem,
    VectorProperties,
)


def stringify(obj: bool):
    if obj:
        return "true"
    else:
        return "false"


def split_top_level(arr: str) -> list[str] | None:
    """Split a literal ``[a, b]`` or ``\\left[a, b\\right]`` on the commas that
    aren't nested in brackets, or None if it isn't a literal array."""
    text = re.sub(r"^\\left\[|\\right\]$", lambda m: m[0][-1], arr.strip())
    if not (text.startswith("[") and text.endswith("]")):
        return None
    parts, depth, start = [], 0, 1
    for i, char in enumerate(text[1:-1], start=1):
        if char in "([{":
            depth += 1
        elif char in ")]}":
            depth -= 1
            if depth < 0:
                return None
        elif char == "," and depth == 0:
            parts.append(text[start:i])
            start = i + 1
    if depth != 0:
        return None
    parts.append(text[start:-1])
    return parts


def balanced(text: str) -> bool:
    depth = 0
    for char in text:
        depth += (char in "([{") - (char in ")]}")
        if depth < 0:
            return False
    return depth == 0


# Text made only of whitespace, including LaTeX spacing commands, is blank.
_BLANK = re.compile(r"(?:\s|\\ |\\,|\\;|\\:|\\!|\\quad|\\qquad|~)*")


def blank_to_empty(text: str) -> str:
    return "" if _BLANK.fullmatch(text) else text


def divide(numerator: float, denominator: float | str) -> float | str:
    """``numerator / denominator``, as LaTeX when the denominator is."""
    if numerator == 0:
        return 0.0
    if isinstance(denominator, str):
        return f"\\frac{{{numerator}}}{{{denominator}}}"
    return numerator / denominator


def vector_text(components: list[float | str]) -> str:
    if all(isinstance(c, float) for c in components):
        return str(components)
    return "\\left[" + ",".join(str(c) for c in components) + "\\right]"


class ItemMigrator:
    def __init__(
        self,
        log: IssueLog | None = None,
        x_scale: float | str = 1.0,
        y_scale: float | str = 1.0,
        z_scale: float | str = 0.5,
    ):
        if log is None:
            log = IssueLog()
        self.log = log
        self.item_type = ""
        self.x_scale = x_scale
        self.y_scale = y_scale
        self.z_scale = z_scale

    def legacy(self, cls, props: dict):
        """Build the legacy dataclass, ignoring (and logging) keys it doesn't
        define. math3d-react's renderers ignore such keys too."""
        fields = {f.name for f in dataclasses.fields(cls)}
        unknown = sorted(set(props) - fields)
        if unknown:
            self.log.ignored_properties(
                f"Ignored unknown {self.item_type} properties: {', '.join(unknown)}"
            )
        return cls(**{k: v for k, v in props.items() if k in fields})

    # Legacy properties that are text, not expressions.
    NOT_MATH = frozenset({"description", "color", "label", "axis", "axes", "name"})

    def rewrite_math(
        self, props: dict, rewrite: Callable[[str], tuple[str, list[str]]], kept: str
    ) -> dict:
        """``props`` with ``rewrite`` applied to math, warning ``kept`` (a
        template taking ``key`` and ``expr``) for each expression it keeps."""
        rewritten = {}
        for key, value in props.items():
            if isinstance(value, str) and key not in self.NOT_MATH:
                value, kept_exprs = rewrite(value)
                for expr in kept_exprs:
                    self.log.warning(kept.format(key=key, expr=expr))
            rewritten[key] = value
        return rewritten

    def rewrite_pdiff(self, props: dict) -> dict:
        return self.rewrite_math(
            props,
            pdiff.rewrite,
            "Kept pdiff in {key}, which math3d-next can't express: {expr}",
        )

    def rewrite_operators(self, props: dict) -> dict:
        return self.rewrite_math(
            props,
            operators.rewrite,
            "Kept | or \\& in {key}, with no clear dot or cross reading: {expr}",
        )

    def split_assignment(self, expr: str) -> tuple[str, str]:
        lhs, *rhs_pieces = expr.split("=")
        if not rhs_pieces:
            self.log.error(f"Expected an assignment. Value: {expr}")
        elif len(rhs_pieces) > 1:
            # e.g. `_f(x,y)=z=3-x`: both apps evaluate the inner assignment to
            # its value, so the expression still works.
            self.log.warning(f"Kept an extra '=' in the right-hand side: {expr}")
        return lhs, "=".join(rhs_pieces)

    def assignment(self, expr: str) -> AssignmentObj:
        lhs, rhs = self.split_assignment(expr)
        return AssignmentObj(
            type="assignment",
            lhs=lhs,
            rhs=rhs,
        )

    def function_assignment(self, expr: str) -> FunctionAssignmentObj:
        lhs, rhs = self.split_assignment(expr)
        matches = re.search(r"([^(\n]*)\(([^)\n]*)\)", lhs)
        if matches is None:
            raise ValueError(f"Expected lhs to have form 'f(...)'. Value: {lhs}")
        name = matches[1]
        params = matches[2].split(",")
        return FunctionAssignmentObj(
            type="function-assignment",
            name=name,
            params=params,
            rhs=rhs,
        )

    def domain_array(self, exprs: list[str]) -> FunctionAssignmentArray:
        items = [self.function_assignment(expr) for expr in exprs]
        return FunctionAssignmentArray(type="array", items=items)

    @staticmethod
    def sampling(x, domain: FunctionAssignmentArray) -> dict:
        """A surface's samples and grid lines. math3d-react samples u with
        uSamples/gridU whichever range is a function; math3d-next evaluates
        the 2nd parameter first when the 1st one's range depends on it
        (validators/src/domainFuncs.ts), giving it samples1/grid1."""
        first = domain.items[0]
        swap = any(depends_on(first.rhs, param) for param in first.params)
        return {
            "samples1": x.vSamples if swap else x.uSamples,
            "samples2": x.uSamples if swap else x.vSamples,
            "grid1": x.gridV if swap else x.gridU,
            "grid2": x.gridU if swap else x.gridV,
        }

    # math3d-next's speeds (sliderMath.ts speedOptions).
    SPEEDS = {
        1 / 16: "1/16",
        1 / 8: "1/8",
        1 / 4: "1/4",
        1 / 2: "1/2",
        3 / 4: "3/4",
        1: "1",
        2: "2",
        4: "4",
        8: "8",
    }

    def slider_timing(self, speed: float) -> tuple[str, str]:
        """A legacy speed's (speedMultiplier, duration). math3d-react sweeps a
        slider's range in 4/speed seconds (AnimationControls.js), so a speed
        without an equal option plays at 1x over that duration."""
        if speed in self.SPEEDS:
            return self.SPEEDS[speed], "4"
        if not isinstance(speed, int | float) or not math.isfinite(speed) or speed <= 0:
            self.log.error(f"Unexpected speedMultiplier: {speed}")
            return "1", "4"
        duration = Fraction(4) / Fraction(speed)
        return "1", f"\\frac{{{duration.numerator}}}{{{duration.denominator}}}"

    def vector_field_samples(self, arr: str) -> tuple[str, str, str]:
        parts = split_top_level(arr)
        if parts is not None and len(parts) == 3:
            first, second, third = (p.replace("\\ ", " ").strip() for p in parts)
            return first, second, third
        # A number isn't one sample count per direction; indexing it fails.
        is_number = re.fullmatch(r"\s*[-+]?(?:\d+\.?\d*|\.\d+)\s*", arr)
        if (
            parts is not None
            or is_number
            or not blank_to_empty(arr)
            or not balanced(arr)
        ):
            self.log.error(f"Invalid vector field samples: {arr}")
            return "10", "10", "5"
        # Any other expression, e.g. a variable, is indexed per direction.
        name = arr.strip()
        if not re.fullmatch(r"\\?[A-Za-z]\w*(?:_\{\w*\})?", name):
            name = f"\\left({name}\\right)"
        first, second, third = (f"{name}\\left[{i}\\right]" for i in (1, 2, 3))
        return first, second, third

    @staticmethod
    def flatten_zero_samples(count: str, range_: str) -> tuple[str, str]:
        """Translate a 0 count to 1 over `[a, a]`, `a` being the range's first
        bound. math3d-react draws a 0 count as one layer at `a`; math3d-next
        centers a lone sample, so the flat range keeps it there."""
        parts = split_top_level(range_)
        if count != "0" or parts is None or len(parts) != 2:
            return count, range_
        first = parts[0].replace("\\ ", " ").strip()
        return "1", f"\\left[{first},{first}\\right]"

    @staticmethod
    def z_index(x) -> str:
        """A blank zIndex becomes "0", MathBox's default, so saved scenes say
        it explicitly (owner decision, 2026-10-24)."""
        return blank_to_empty(x.zIndex or "") or "0"

    @staticmethod
    def calculated_visibility(x) -> dict:
        """A blank expression turns calculated visibility off, so the item
        follows its own ``visible``, and LaTeX spacing counts as blank (owner
        decisions, 2026-10-23 and 2026-10-24). math3d-react drew such an item
        hidden while the author edited and visible only after a fresh load."""
        calc = blank_to_empty(x.calculatedVisibility or "")
        return {
            "calculatedVisibility": calc,
            "useCalculatedVisibility": bool(calc and x.useCalculatedVisibility),
        }

    def translate_axis(self, props) -> AxisProperties:
        x = self.legacy(old.AxisProperties, props)
        return AxisProperties(
            color=x.color,
            visible=x.visible,
            **self.calculated_visibility(x),
            opacity=x.opacity,
            zIndex=self.z_index(x),
            zBias=x.zBias,
            zOrder="",
            label=x.label,
            labelVisible=stringify(x.labelVisible),
            min=x.min,
            max=x.max,
            # cast narrows the legacy str for mypy; Pydantic validates the
            # Literal at runtime when AxisProperties is constructed.
            axis=cast(Literal["x", "y", "z"], x.axis),
            scale=x.scale,
            ticksVisible=stringify(x.ticksVisible),
            size=x.size,
            width=x.width,
            end="true",
            start="false",
            divisions="10",
            description=x.description,
        )

    def translate_boolean_variable(self, props) -> BooleanVariableProperties:
        x = self.legacy(old.BooleanVariable, props)
        return BooleanVariableProperties(
            description=x.description,
            value=AssignmentObj(
                lhs=x.name,
                rhs=stringify(x.value),
                type="assignment",
            ),
        )

    def translate_camera(self, props) -> CameraProperties:
        x = self.legacy(old.CameraProperties, props)

        position_in = [
            # Some legacy data has relativePosition as [null, null, null]
            default if value is None else value
            for value, default in zip(x.relativePosition, [0.5, -2, 0.5], strict=False)
        ]
        look_at = [
            default if value is None else value
            for value, default in zip(x.relativeLookAt, [0, 0, 0], strict=False)
        ]
        if x.isOrthographic:
            # math3d-react fakes orthographic with a 50x dolly zoom and saves the
            # dollied position (Camera.dollyZoom in MathBoxComponents.js);
            # math3d-next stores the un-dollied one (viewport/Camera.tsx).
            position_in = [
                t + (p - t) / 50 for p, t in zip(position_in, look_at, strict=True)
            ]
        scales = [self.x_scale, self.y_scale, self.z_scale]
        position = vector_text(
            [divide(p, k) for p, k in zip(position_in, scales, strict=True)]
        )
        target = vector_text(
            [divide(t, k) for t, k in zip(look_at, scales, strict=True)]
        )
        if x.useComputed:
            position = x.computedPosition
            target = x.computedLookAt
        return CameraProperties(
            description=x.description,
            useRelative=stringify(not x.useComputed),
            position=position,
            target=target,
            isOrthographic=stringify(x.isOrthographic),
            isPanEnabled=stringify(x.isPanEnabled),
            isZoomEnabled=stringify(x.isZoomEnabled),
            isRotateEnabled=stringify(x.isRotateEnabled),
            # math3d-next writes the camera's numbers back after a drag moves it,
            # which would overwrite a computed camera's expressions.
            updateOnDrag=stringify(not x.useComputed),
        )

    def translate_explicit_surface(self, props) -> ExplicitSurfaceProperties:
        x = self.legacy(old.ExplicitSurfaceProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(y)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(x)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ExplicitSurfaceProperties(
            color=x.color,
            colorExpr=translate_color_expr(
                self.function_assignment(x.colorExpr), "explicit", expr.params
            ),
            description=x.description,
            domain=domain,
            expr=expr,
            **self.sampling(x, domain),
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            shaded=stringify(x.shaded),
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_explicit_surface_polar(self, props) -> ExplicitSurfacePolarProperties:
        x = self.legacy(old.ExplicitSurfacePolarProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(\\theta)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(r)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ExplicitSurfacePolarProperties(
            color=x.color,
            colorExpr=translate_color_expr(
                self.function_assignment(x.colorExpr), "polar", expr.params
            ),
            description=x.description,
            domain=domain,
            expr=expr,
            **self.sampling(x, domain),
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            shaded=stringify(x.shaded),
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_grid(self, props) -> GridProperties:
        x = self.legacy(old.GridProperties, props)
        return GridProperties(
            color=x.color,
            description=x.description,
            opacity=x.opacity,
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
            divisions=x.divisions,
            width=x.width,
            snap=stringify(x.snap),
            # cast narrows the legacy str for mypy; Pydantic validates the
            # Literal at runtime when GridProperties is constructed.
            axes=cast(Literal["xy", "yz", "zx"], x.axes),
        )

    def translate_folder(self, props) -> FolderProperties:
        x = self.legacy(old.FolderProperties, props)
        return FolderProperties(
            description=x.description, isCollapsed=stringify(x.isCollapsed)
        )

    def translate_implicit_surface(self, props) -> ImplicitSurfaceProperties:
        x = self.legacy(old.ImplicitSurfaceProperties, props)
        return ImplicitSurfaceProperties(
            color=x.color,
            description=x.description,
            domain=ExprArray(
                type="array",
                items=[
                    ExprObj(
                        type="expr",
                        expr=x.rangeX,
                    ),
                    ExprObj(
                        type="expr",
                        expr=x.rangeY,
                    ),
                    ExprObj(
                        type="expr",
                        expr=x.rangeZ,
                    ),
                ],
            ),
            lhs=self.function_assignment(x.lhs),
            rhs=self.function_assignment(x.rhs),
            opacity=x.opacity,
            samples=x.samples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_line(self, props) -> LineProperties:
        x = self.legacy(old.LineProperties, props)
        return LineProperties(
            color=x.color,
            coords=x.coords,
            description=x.description,
            end=stringify(x.end),
            label=x.label,
            labelVisible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            start=stringify(x.start),
            visible=x.visible,
            **self.calculated_visibility(x),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_parametric_curve(self, props) -> ParametricCurveProperties:
        x = self.legacy(old.ParametricCurveProperties, props)
        return ParametricCurveProperties(
            color=x.color,
            description=x.description,
            domain=ExprArray(
                type="array",
                items=[
                    ExprObj(
                        type="expr",
                        expr=x.range,
                    ),
                ],
            ),
            end=stringify(x.end),
            expr=self.function_assignment(x.expr),
            opacity=x.opacity,
            samples1=x.samples,
            start=stringify(x.start),
            size=x.size,
            visible=x.visible,
            **self.calculated_visibility(x),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_parametric_surface(self, props) -> ParametricSurfaceProperties:
        x = self.legacy(old.ParametricSurfaceProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(v)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(u)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ParametricSurfaceProperties(
            color=x.color,
            colorExpr=translate_color_expr(
                self.function_assignment(x.colorExpr), "parametric", expr.params
            ),
            description=x.description,
            domain=domain,
            expr=expr,
            **self.sampling(x, domain),
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            shaded=stringify(x.shaded),
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_point(self, props) -> PointProperties:
        x = self.legacy(old.PointProperties, props)
        return PointProperties(
            color=x.color,
            coords=x.coords,
            description=x.description,
            label=x.label,
            labelVisible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            visible=x.visible,
            **self.calculated_visibility(x),
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_variable(self, props) -> VariableProperties:
        x = self.legacy(old.VariableProperties, props)
        return VariableProperties(
            description=x.description,
            value=self.assignment(f"{x.name}={x.value}"),
        )

    def translate_variable_slider(self, props) -> VariableSliderProperties:
        x = self.legacy(old.VariableSlider, props)
        speed, duration = self.slider_timing(x.speedMultiplier)
        return VariableSliderProperties(
            description=x.description,
            duration=duration,
            fps="60",
            isAnimating=stringify(x.isAnimating),
            range=StrArray(type="array", items=[x.min, x.max]),
            speedMultiplier=speed,
            value=self.assignment(f"{x.name}={x.value}"),
        )

    def translate_vector(self, props) -> VectorProperties:
        x = self.legacy(old.VectorProperties, props)
        return VectorProperties(
            color=x.color,
            components=x.components,
            description=x.description,
            end=stringify(x.end),
            label=x.label,
            labelVisible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            start=stringify(x.start),
            tail=x.tail,
            visible=x.visible,
            **self.calculated_visibility(x),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_vector_field(self, props) -> VectorFieldProperties:
        x = self.legacy(old.VectorFieldProperties, props)
        counts = self.vector_field_samples(x.samples)
        samples1, range_x = self.flatten_zero_samples(counts[0], x.rangeX)
        samples2, range_y = self.flatten_zero_samples(counts[1], x.rangeY)
        samples3, range_z = self.flatten_zero_samples(counts[2], x.rangeZ)
        return VectorFieldProperties(
            color=x.color,
            description=x.description,
            domain=ExprArray(
                type="array",
                items=[
                    ExprObj(
                        type="expr",
                        expr=range_x,
                    ),
                    ExprObj(
                        type="expr",
                        expr=range_y,
                    ),
                    ExprObj(
                        type="expr",
                        expr=range_z,
                    ),
                ],
            ),
            end=stringify(x.end),
            expr=self.function_assignment(x.expr),
            opacity=x.opacity,
            samples1=samples1,
            samples2=samples2,
            samples3=samples3,
            scale=x.scale,
            size=x.size,
            start=stringify(x.start),
            visible=x.visible,
            **self.calculated_visibility(x),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=self.z_index(x),
        )

    def translate_item(self, item, item_id) -> MathItemUnion:
        copy = deepcopy(item)
        item_type = copy["type"]
        del copy["type"]
        self.log.set_prefix(item_id)
        self.item_type = item_type
        copy = self.rewrite_operators(self.rewrite_pdiff(copy))

        if item_type == "AXIS":
            return AxisItem(
                id=item_id,
                type="AXIS",
                properties=self.translate_axis(copy),
            )

        if item_type == "BOOLEAN_VARIABLE":
            return BooleanVariableItem(
                id=item_id,
                type="BOOLEAN_VARIABLE",
                properties=self.translate_boolean_variable(copy),
            )

        if item_type == "CAMERA":
            return CameraItem(
                id=item_id,
                type="CAMERA",
                properties=self.translate_camera(copy),
            )

        if item_type == "EXPLICIT_SURFACE":
            return ExplicitSurfaceItem(
                id=item_id,
                type="EXPLICIT_SURFACE",
                properties=self.translate_explicit_surface(copy),
            )

        if item_type == "EXPLICIT_SURFACE_POLAR":
            return ExplicitSurfacePolarItem(
                id=item_id,
                type="EXPLICIT_SURFACE_POLAR",
                properties=self.translate_explicit_surface_polar(copy),
            )

        if item_type == "FOLDER":
            return FolderItem(
                id=item_id,
                type="FOLDER",
                properties=self.translate_folder(copy),
            )

        if item_type == "GRID":
            return GridItem(
                id=item_id,
                type="GRID",
                properties=self.translate_grid(copy),
            )

        if item_type == "IMPLICIT_SURFACE":
            return ImplicitSurfaceItem(
                id=item_id,
                type="IMPLICIT_SURFACE",
                properties=self.translate_implicit_surface(copy),
            )

        if item_type == "LINE":
            return LineItem(
                id=item_id,
                type="LINE",
                properties=self.translate_line(copy),
            )

        if item_type == "PARAMETRIC_CURVE":
            return ParametricCurveItem(
                id=item_id,
                type="PARAMETRIC_CURVE",
                properties=self.translate_parametric_curve(copy),
            )

        if item_type == "PARAMETRIC_SURFACE":
            return ParametricSurfaceItem(
                id=item_id,
                type="PARAMETRIC_SURFACE",
                properties=self.translate_parametric_surface(copy),
            )

        if item_type == "POINT":
            return PointItem(
                id=item_id,
                type="POINT",
                properties=self.translate_point(copy),
            )

        if item_type == "VARIABLE":
            return VariableItem(
                id=item_id,
                type="VARIABLE",
                properties=self.translate_variable(copy),
            )

        if item_type == "VARIABLE_SLIDER":
            return VariableSliderItem(
                id=item_id,
                type="VARIABLE_SLIDER",
                properties=self.translate_variable_slider(copy),
            )

        if item_type == "VECTOR":
            return VectorItem(
                id=item_id,
                type="VECTOR",
                properties=self.translate_vector(copy),
            )

        if item_type == "VECTOR_FIELD":
            return VectorFieldItem(
                id=item_id,
                type="VECTOR_FIELD",
                properties=self.translate_vector_field(copy),
            )

        raise NotImplementedError(f"Unknown item type: {item_type}")
