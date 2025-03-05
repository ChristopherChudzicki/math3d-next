import re

import scenes.legacy_scene_utils.legacy_data as old
import scenes.math_items as new
from scenes.legacy_scene_utils.IssueLog import IssueLog
from copy import deepcopy


def stringify(obj: bool):
    if obj:
        return "true"
    else:
        return "false"


class ItemMigrator:
    def __init__(self, log: IssueLog | None = None):
        if log is None:
            log = IssueLog()
        self.log = log

    def assignment(self, expr: str) -> new.ParseableAssignment:
        lhs, *rhs_pieces = expr.split("=")
        rhs = "".join(rhs_pieces)
        if len(rhs_pieces) != 1:
            self.log.error("Expected one rhs. Value: {expr}")

        return new.ParseableAssignment(
            type=new.ParseableAssignmentType.ASSIGNMENT,
            lhs=lhs,
            rhs=rhs,
        )

    def function_assignment(self, expr: str) -> new.ParseableFunctionAssignment:
        lhs, *rhs_pieces = expr.split("=")
        rhs = "".join(rhs_pieces)

        if len(rhs_pieces) != 1:
            self.log.error("Expected one rhs. Value: {expr}")

        matches = re.search(r"(.*?)\((.*?)\)", lhs)
        if matches is None:
            raise ValueError(f"Expected lhs to have form 'f(...)'. Value: {lhs}")
        name = matches[1]
        params = matches[2].split(",")
        return new.ParseableFunctionAssignment(
            type=new.ParseableFunctionAssignmentType.FUNCTION_ASSIGNMENT,
            name=name,
            params=params,
            rhs=rhs,
        )

    def domain_array(self, exprs: list[str]) -> new.ParseableFunctionAssignmentArray:
        items = [self.function_assignment(expr) for expr in exprs]
        return new.ParseableFunctionAssignmentArray(
            type=new.ParseableFunctionAssignmentArrayType.ARRAY, items=items
        )

    def find_speed(self, speed: float) -> str:
        if speed == 0.125:
            return "1/8"
        if speed == 0.25:
            return "1/4"
        if speed == 0.5:
            return "1/2"
        if speed == 0.75:
            return "3/4"
        if speed == 1:
            return "1"
        if speed == 2:
            return "2"
        if speed == 4:
            return "4"
        if speed == 8:
            return "8"

        self.log.error(f"Unexpected speedMultipler: {speed}")
        return "1"

    def vector_field_samples(self, arr: str):
        match = re.match(r"(?:\\left)?\[(.+?),(.+?),(.+?)(?:\right)?\]", arr)
        if not match:
            self.log.error(f"Invalid vector field samples: {arr}")
            return "10", "10", "5"
        return match[1].strip(), match[2].strip(), match[3].strip()

    def translate_axis(self, props) -> new.ItemPropertiesAxis:
        x = old.AxisProperties(**props)
        return new.ItemPropertiesAxis(
            color=x.color,
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            opacity=x.opacity,
            z_index=x.zIndex,
            z_bias=x.zBias,
            label=x.label,
            label_visible=stringify(x.labelVisible),
            min=x.min,
            max=x.max,
            axis=new.PropAxis(x.axis),
            scale=x.scale,
            ticks_visible=stringify(x.ticksVisible),
            size=x.size,
            width=x.width,
            end="true",
            start="false",
            divisions="10",
            description=x.description,
        )

    def translate_boolean_variable(self, props) -> new.ItemPropertiesBooleanVariable:
        x = old.BooleanVariable(**props)
        return new.ItemPropertiesBooleanVariable(
            description=x.description,
            value=new.ParseableAssignment(
                lhs=x.name,
                rhs=stringify(x.value),
                type=new.ParseableAssignmentType.ASSIGNMENT,
            ),
        )

    def translate_camera(self, props) -> new.ItemPropertiesCamera:
        x = old.CameraProperties(**props)
        position = str(x.relativePosition)
        target = str(x.relativeLookAt)
        if x.useComputed:
            position = x.computedPosition
            target = x.computedLookAt
        return new.ItemPropertiesCamera(
            description=x.description,
            use_relative=stringify(not x.useComputed),
            position=position,
            target=target,
            is_orthographic=stringify(x.isOrthographic),
            is_pan_enabled=stringify(x.isPanEnabled),
            is_zoom_enabled=stringify(x.isZoomEnabled),
            is_rotate_enabled=stringify(x.isRotateEnabled),
            update_on_drag=stringify(True),
        )

    def translate_explicit_surface(self, props) -> new.ItemPropertiesExplicitSurface:
        x = old.ExplicitSurfaceProperties(**props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(y)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(x)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return new.ItemPropertiesExplicitSurface(
            color=x.color,
            color_expr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            grid_opacity=x.gridOpacity,
            grid_width=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_explicit_surface_polar(
        self, props
    ) -> new.ItemPropertiesExplicitSurface:
        x = old.ExplicitSurfacePolarProperties(**props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(Q)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(r)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return new.ItemPropertiesExplicitSurface(
            color=x.color,
            color_expr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            grid_opacity=x.gridOpacity,
            grid_width=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_grid(self, props) -> new.ItemPropertiesGrid:
        x = old.GridProperties(**props)
        return new.ItemPropertiesGrid(
            color=x.color,
            description=x.description,
            opacity=x.opacity,
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
            divisions=x.divisions,
            width="1/2",
            snap="false",
            axes=new.PropAxes(x.axes),
        )

    def translate_folder(self, props) -> new.ItemPropertiesFolder:
        x = old.FolderProperties(**props)
        return new.ItemPropertiesFolder(
            description=x.description, is_collapsed=stringify(x.isCollapsed)
        )

    def translate_implicit_surface(self, props) -> new.ItemPropertiesImplicitSurface:
        x = old.ImplicitSurfaceProperties(**props)
        return new.ItemPropertiesImplicitSurface(
            color=x.color,
            description=x.description,
            domain=new.ParseableExprArray(
                type=new.ParseableExprArrayType.ARRAY,
                items=[
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
                        expr=x.rangeX,
                    ),
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
                        expr=x.rangeY,
                    ),
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
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
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_line(self, props) -> new.ItemPropertiesLine:
        x = old.LineProperties(**props)
        return new.ItemPropertiesLine(
            color=x.color,
            coords=x.coords,
            description=x.description,
            end=stringify(x.end),
            label=x.label,
            label_visible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            start=stringify(x.start),
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_parametric_curve(self, props) -> new.ItemPropertiesParametricCurve:
        x = old.ParametricCurveProperties(**props)
        return new.ItemPropertiesParametricCurve(
            color=x.color,
            description=x.description,
            domain=new.ParseableExprArray(
                type=new.ParseableExprArrayType.ARRAY,
                items=[
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
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
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_parametric_surface(
        self, props
    ) -> new.ItemPropertiesParametricSurface:
        x = old.ParametricSurfaceProperties(**props)
        expr = self.function_assignment(x.expr)
        rangeU = x.rangeU if "=" in x.rangeU else f"_f(v)={x.rangeU}"
        rangeV = x.rangeV if "=" in x.rangeV else f"_f(u)={x.rangeV}"
        domain = self.domain_array([rangeU, rangeV])
        return new.ItemPropertiesParametricSurface(
            color=x.color,
            color_expr=self.function_assignment(x.colorExpr),
            description=x.description,
            domain=domain,
            expr=expr,
            grid1=x.gridU,
            grid2=x.gridV,
            grid_opacity=x.gridOpacity,
            grid_width=x.gridWidth,
            opacity=x.opacity,
            samples1=x.uSamples,
            samples2=x.vSamples,
            shaded=stringify(x.shaded),
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_point(self, props) -> new.ItemPropertiesPoint:
        x = old.PointProperties(**props)
        return new.ItemPropertiesPoint(
            color=x.color,
            coords=x.coords,
            description=x.description,
            label=x.label,
            label_visible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_variable(self, props) -> new.ItemPropertiesVariable:
        x = old.VariableProperties(**props)
        return new.ItemPropertiesVariable(
            description=x.description,
            value=self.assignment(f"{x.name}={x.value}"),
        )

    def translate_variable_slider(self, props) -> new.ItemPropertiesVariableSlider:
        x = old.VariableSlider(**props)
        return new.ItemPropertiesVariableSlider(
            description=x.description,
            duration="4",
            fps="30",
            is_animating=stringify(x.isAnimating),
            range=new.ParseableStringArray(
                type=new.ParseableStringArrayType.ARRAY, items=[x.min, x.max]
            ),
            speed_multiplier=self.find_speed(x.speedMultiplier),
            value=self.assignment(f"{x.name}={x.value}"),
        )

    def translate_vector(self, props) -> new.ItemPropertiesVector:
        x = old.VectorProperties(**props)
        return new.ItemPropertiesVector(
            color=x.color,
            components=x.components,
            description=x.description,
            end=stringify(x.end),
            label=x.label,
            label_visible=stringify(x.labelVisible),
            opacity=x.opacity,
            size=x.size,
            start=stringify(x.start),
            tail=x.tail,
            visible=x.visible,
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_vector_field(self, props) -> new.ItemPropertiesVectorField:
        x = old.VectorFieldProperties(**props)
        samples1, samples2, samples3 = self.vector_field_samples(x.samples)
        return new.ItemPropertiesVectorField(
            color=x.color,
            description=x.description,
            domain=new.ParseableExprArray(
                type=new.ParseableExprArrayType.ARRAY,
                items=[
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
                        expr=x.rangeX,
                    ),
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
                        expr=x.rangeY,
                    ),
                    new.ParseableExpr(
                        type=new.ParseableExprType.EXPR,
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
            calculated_visibility=x.calculatedVisibility,
            use_calculated_visibility=bool(
                x.calculatedVisibility and x.useCalculatedVisibility
            ),
            width=x.width,
            z_bias=x.zBias,
            z_index=x.zIndex,
        )

    def translate_item(self, item, item_id) -> new.MathItem:
        copy = deepcopy(item)
        item_type = copy["type"]
        del copy["type"]

        if item_type == "AXIS":
            extra_defaults = {}
            if item_id == "axis-x":
                extra_defaults = {"axis": "x", "label": "x"}
            elif item_id == "axis-y":
                extra_defaults = {"axis": "y", "label": "y"}
            elif item_id == "axis-z":
                extra_defaults = {"axis": "z", "scale": "1/2", "label": "z"}

            return new.MathItemAxis(
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
            return new.MathItemBooleanVariable(
                id=item_id,
                type="BOOLEAN_VARIABLE",
                properties=self.translate_boolean_variable(copy),
            )

        if item_type == "CAMERA":
            return new.MathItemCamera(
                id=item_id,
                type="CAMERA",
                properties=self.translate_camera(copy),
            )

        if item_type == "EXPLICIT_SURFACE":
            return new.MathItemExplicitSurface(
                id=item_id,
                type="EXPLICIT_SURFACE",
                properties=self.translate_explicit_surface(copy),
            )

        if item_type == "EXPLICIT_SURFACE_POLAR":
            return new.MathItemExplicitSurfacePolar(
                id=item_id,
                type="EXPLICIT_SURFACE_POLAR",
                properties=self.translate_explicit_surface_polar(copy),
            )

        if item_type == "FOLDER":
            return new.MathItemFolder(
                id=item_id,
                type="FOLDER",
                properties=self.translate_folder(copy),
            )

        if item_type == "GRID":
            return new.MathItemGrid(
                id=item_id,
                type="GRID",
                properties=self.translate_grid(copy),
            )

        if item_type == "IMPLICIT_SURFACE":
            return new.MathItemImplicitSurface(
                id=item_id,
                type="IMPLICIT_SURFACE",
                properties=self.translate_implicit_surface(copy),
            )

        if item_type == "LINE":
            return new.MathItemLine(
                id=item_id,
                type="LINE",
                properties=self.translate_line(copy),
            )

        if item_type == "PARAMETRIC_CURVE":
            return new.MathItemParametricCurve(
                id=item_id,
                type="PARAMETRIC_CURVE",
                properties=self.translate_parametric_curve(copy),
            )

        if item_type == "PARAMETRIC_SURFACE":
            return new.MathItemParametricSurface(
                id=item_id,
                type="PARAMETRIC_SURFACE",
                properties=self.translate_parametric_surface(copy),
            )

        if item_type == "POINT":
            return new.MathItemPoint(
                id=item_id,
                type="POINT",
                properties=self.translate_point(copy),
            )

        if item_type == "VARIABLE":
            return new.MathItemVariable(
                id=item_id,
                type="VARIABLE",
                properties=self.translate_variable(copy),
            )

        if item_type == "VARIABLE_SLIDER":
            return new.MathItemVariableSlider(
                id=item_id,
                type="VARIABLE_SLIDER",
                properties=self.translate_variable_slider(copy),
            )

        if item_type == "VECTOR":
            return new.MathItemVector(
                id=item_id,
                type="VECTOR",
                properties=self.translate_vector(copy),
            )

        if item_type == "VECTOR_FIELD":
            return new.MathItemVectorField(
                id=item_id,
                type="VECTOR_FIELD",
                properties=self.translate_vector_field(copy),
            )

        raise NotImplementedError(f"Unknown item type: {copy['type']}")
