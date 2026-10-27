import dataclasses
import math
import re
from copy import deepcopy
from typing import Literal, cast

import scenes.legacy_scene_utils.legacy_data as old
from scenes.legacy_scene_utils.issue_log import IssueLog
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


class ItemMigrator:
    def __init__(
        self,
        log: IssueLog | None = None,
        x_scale: float = 1.0,
        y_scale: float = 1.0,
        z_scale: float = 0.5,
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
        define, as math3d-react's own rehydrate does."""
        fields = {f.name for f in dataclasses.fields(cls)}
        unknown = sorted(set(props) - fields)
        if unknown:
            self.log.warning(
                f"Ignored unknown {self.item_type} properties: {', '.join(unknown)}"
            )
        return cls(**{k: v for k, v in props.items() if k in fields})

    def assignment(self, expr: str) -> AssignmentObj:
        lhs, *rhs_pieces = expr.split("=")
        rhs = "=".join(rhs_pieces)
        if len(rhs_pieces) != 1:
            self.log.error(f"Expected one rhs. Value: {expr}")

        return AssignmentObj(
            type="assignment",
            lhs=lhs,
            rhs=rhs,
        )

    def function_assignment(self, expr: str) -> FunctionAssignmentObj:
        lhs, *rhs_pieces = expr.split("=")
        rhs = "=".join(rhs_pieces)

        if len(rhs_pieces) != 1:
            self.log.error(f"Expected one rhs. Value: {expr}")

        matches = re.search(r"(.*?)\((.*?)\)", lhs)
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

    # math3d-next's speeds (SliderControls.tsx speedOptions). Each step doubles,
    # so an unsupported legacy speed maps to the nearest one on a log scale.
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

    def find_speed(self, speed: float) -> str:
        if speed in self.SPEEDS:
            return self.SPEEDS[speed]
        if not speed or speed <= 0:
            self.log.error(f"Unexpected speedMultiplier: {speed}")
            return "1"
        nearest = min(self.SPEEDS, key=lambda s: abs(math.log(s / speed)))
        self.log.warning(f"speedMultiplier {speed} -> {self.SPEEDS[nearest]}")
        return self.SPEEDS[nearest]

    def vector_field_samples(self, arr: str):
        match = re.match(r"(?:\\left)?\[(.+?),(.+?),(.+?)(?:\\right)?\]$", arr.strip())
        if not match:
            self.log.error(f"Invalid vector field samples: {arr}")
            return "10", "10", "5"
        return tuple(m.replace("\\ ", " ").strip() for m in match.groups())  # type: ignore[return-value]

    def translate_axis(self, props) -> AxisProperties:
        x = self.legacy(old.AxisProperties, props)
        return AxisProperties(
            color=x.color,
            visible=x.visible,
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            opacity=x.opacity,
            zIndex=x.zIndex,
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
        relativePosition = [p / k for p, k in zip(position_in, scales, strict=True)]
        relativeLookAt = [t / k for t, k in zip(look_at, scales, strict=True)]
        position = str(relativePosition)
        target = str(relativeLookAt)
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
            updateOnDrag=stringify(True),
        )

    def translate_explicit_surface(self, props) -> ExplicitSurfaceProperties:
        x = self.legacy(old.ExplicitSurfaceProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(y)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(x)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ExplicitSurfaceProperties(
            color=x.color,
            colorExpr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_explicit_surface_polar(self, props) -> ExplicitSurfacePolarProperties:
        x = self.legacy(old.ExplicitSurfacePolarProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(\\theta)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(r)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ExplicitSurfacePolarProperties(
            color=x.color,
            colorExpr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_grid(self, props) -> GridProperties:
        x = self.legacy(old.GridProperties, props)
        return GridProperties(
            color=x.color,
            description=x.description,
            opacity=x.opacity,
            visible=x.visible,
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_parametric_surface(self, props) -> ParametricSurfaceProperties:
        x = self.legacy(old.ParametricSurfaceProperties, props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(v)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(u)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return ParametricSurfaceProperties(
            color=x.color,
            colorExpr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            gridOpacity=x.gridOpacity,
            gridWidth=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_variable(self, props) -> VariableProperties:
        x = self.legacy(old.VariableProperties, props)
        return VariableProperties(
            description=x.description,
            value=self.assignment(f"{x.name}={x.value}"),
        )

    def translate_variable_slider(self, props) -> VariableSliderProperties:
        x = self.legacy(old.VariableSlider, props)
        return VariableSliderProperties(
            description=x.description,
            duration="4",
            fps="50",
            isAnimating=stringify(x.isAnimating),
            range=StrArray(type="array", items=[x.min, x.max]),
            speedMultiplier=self.find_speed(x.speedMultiplier),
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_vector_field(self, props) -> VectorFieldProperties:
        x = self.legacy(old.VectorFieldProperties, props)
        samples1, samples2, samples3 = self.vector_field_samples(x.samples)
        return VectorFieldProperties(
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
            calculatedVisibility=x.calculatedVisibility,
            useCalculatedVisibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            zBias=x.zBias,
            zOrder="",
            zIndex=x.zIndex,
        )

    def translate_item(self, item, item_id) -> MathItemUnion:
        copy = deepcopy(item)
        item_type = copy["type"]
        del copy["type"]
        self.log.set_prefix(item_id)
        self.item_type = item_type

        if item_type == "AXIS":
            extra_defaults = {}
            if item_id == "axis-x":
                extra_defaults = {"axis": "x", "label": "x"}
            elif item_id == "axis-y":
                extra_defaults = {"axis": "y", "label": "y"}
            elif item_id == "axis-z":
                extra_defaults = {"axis": "z", "scale": "1/2", "label": "z"}

            return AxisItem(
                id=item_id,
                type="AXIS",
                properties=self.translate_axis(
                    {
                        **extra_defaults,
                        **copy,
                    }
                ),
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
