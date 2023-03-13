import re
from typing import Any, Union

import scenes.management.migrate_legacy_data.legacy_data as old
import scenes.math_items as new


def stringify(obj: bool):
    if obj:
        return "true"
    else:
        return "false"


def get_visible(x) -> str:
    if hasattr(x, "useCalculatedVisibility") and x.useCalculatedVisibility:
        return x.calculatedVisibility
    return stringify(x.visible)


def assignment(expr: str) -> new.ParseableAssignment:
    lhs, rhs = expr.split("=")
    return new.ParseableAssignment(
        type=new.ParseableAssignmentType.ASSIGNMENT,
        lhs=lhs,
        rhs=rhs,
    )


def function_assignment(expr: str) -> new.ParseableFunctionAssignment:
    lhs, rhs = expr.split("=")
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


def domain_array(exprs: list[str]) -> new.ParseableFunctionAssignmentArray:
    items = [function_assignment(expr) for expr in exprs]
    return new.ParseableFunctionAssignmentArray(
        type=new.ParseableFunctionAssignmentArrayType.ARRAY, items=items
    )


def translate_axis(props) -> new.ItemPropertiesAxis:
    x = old.AxisProperties(**props)
    return new.ItemPropertiesAxis(
        color=x.color,
        visible=get_visible(x),
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


def translate_boolean_variable(props) -> new.ItemPropertiesBooleanVariable:
    x = old.BooleanVariable(**props)
    return new.ItemPropertiesBooleanVariable(
        description=x.description,
        value=new.ParseableAssignment(
            lhs=x.name,
            rhs=stringify(x.value),
            type=new.ParseableAssignmentType.ASSIGNMENT,
        ),
    )


def translate_camera(props) -> new.ItemPropertiesCamera:
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


def translate_explicit_surface(props) -> new.ItemPropertiesExplicitSurface:
    x = old.ExplicitSurfaceProperties(**props)
    expr = function_assignment(x.expr)
    rangeU = x.rangeU if "=" in x.rangeU else f"_f(y)={x.rangeU}"
    rangeV = x.rangeV if "=" in x.rangeV else f"_f(x)={x.rangeV}"
    domain = domain_array([rangeU, rangeV])
    return new.ItemPropertiesExplicitSurface(
        color=x.color,
        color_expr=x.colorExpr,
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
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_explicit_surface_polar(props) -> new.ItemPropertiesExplicitSurface:
    x = old.ExplicitSurfacePolarProperties(**props)
    expr = function_assignment(x.expr)
    rangeU = x.rangeU if "=" in x.rangeU else f"_f(Q)={x.rangeU}"
    rangeV = x.rangeV if "=" in x.rangeV else f"_f(r)={x.rangeV}"
    domain = domain_array([rangeU, rangeV])
    return new.ItemPropertiesExplicitSurface(
        color=x.color,
        color_expr=x.colorExpr,
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
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_grid(props) -> new.ItemPropertiesGrid:
    x = old.GridProperties(**props)
    return new.ItemPropertiesGrid(
        color=x.color,
        description=x.description,
        opacity=x.opacity,
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
        divisions=x.divisions,
        width="1/2",
        snap="false",
        axes=new.PropAxes(x.axes),
    )


def translate_folder(props) -> new.ItemPropertiesFolder:
    x = old.FolderProperties(**props)
    return new.ItemPropertiesFolder(
        description=x.description, is_collapsed=stringify(x.isCollapsed)
    )


def translate_implicit_surface(props) -> new.ItemPropertiesImplicitSurface:
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
        lhs=function_assignment(x.lhs),
        rhs=function_assignment(x.rhs),
        opacity=x.opacity,
        samples=x.samples,
        shaded=stringify(x.shaded),
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_line(props) -> new.ItemPropertiesLine:
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
        visible=get_visible(x),
        width=x.width,
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_parametric_curve(props) -> new.ItemPropertiesParametricCurve:
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
        expr=function_assignment(x.expr),
        opacity=x.opacity,
        samples1=x.samples,
        start=stringify(x.start),
        size=x.size,
        visible=get_visible(x),
        width=x.width,
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_parametric_surface(props) -> new.ItemPropertiesParametricSurface:
    x = old.ParametricSurfaceProperties(**props)
    expr = function_assignment(x.expr)
    rangeU = x.rangeU if "=" in x.rangeU else f"_f(v)={x.rangeU}"
    rangeV = x.rangeV if "=" in x.rangeV else f"_f(u)={x.rangeV}"
    domain = domain_array([rangeU, rangeV])
    return new.ItemPropertiesParametricSurface(
        color=x.color,
        color_expr=x.colorExpr,
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
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_point(props) -> new.ItemPropertiesPoint:
    x = old.PointProperties(**props)
    return new.ItemPropertiesPoint(
        color=x.color,
        coords=x.coords,
        description=x.description,
        label=x.label,
        label_visible=stringify(x.labelVisible),
        opacity=x.opacity,
        size=x.size,
        visible=get_visible(x),
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_variable(props) -> new.ItemPropertiesVariable:
    x = old.VariableProperties(**props)
    return new.ItemPropertiesVariable(
        description=x.description,
        value=assignment(f"{x.name}={x.value}"),
    )


def translate_variable_slider(props) -> new.ItemPropertiesVariableSlider:
    x = old.VariableSlider(**props)
    return new.ItemPropertiesVariableSlider(
        description=x.description,
        duration="4",
        fps="30",
        is_animating=stringify(x.isAnimating),
        range=new.ParseableStringArray(
            type=new.ParseableStringArrayType.ARRAY, items=[x.min, x.max]
        ),
        speed_multiplier=x.speedMultiplier,
        value=assignment(f"{x.name}={x.value}"),
    )


def translate_vector(props) -> new.ItemPropertiesVector:
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
        visible=get_visible(x),
        width=x.width,
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def vector_field_samples(arr: str, index: int):
    match = re.match(r"\[(.+?),(.+?),(.+?)\]", arr)
    if not match:
        raise ValueError(f"Invalid vector field samples: {arr}")
    return match[index].strip()


def translate_vector_field(props) -> new.ItemPropertiesVectorField:
    x = old.VectorFieldProperties(**props)
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
        expr=function_assignment(x.expr),
        opacity=x.opacity,
        samples1=vector_field_samples(x.samples, 1),
        samples2=vector_field_samples(x.samples, 2),
        samples3=vector_field_samples(x.samples, 3),
        scale=x.scale,
        size=x.size,
        start=stringify(x.start),
        visible=get_visible(x),
        width=x.width,
        z_bias=x.zBias,
        z_index=x.zIndex,
    )


def translate_item(item) -> new.MathItem:
    item_id = item["id"]
    item_type = item["type"]
    del item["id"]
    del item["type"]

    if item_type == "AXIS":
        return new.MathItemAxis(
            id=item_id, type="AXIS", properties=translate_axis(item)
        )

    if item_type == "BOOLEAN_VARIABLE":
        return new.MathItemBooleanVariable(
            id=item_id,
            type="BOOLEAN_VARIABLE",
            properties=translate_boolean_variable(item),
        )

    if item_type == "CAMERA":
        return new.MathItemCamera(
            id=item_id,
            type="CAMERA",
            properties=translate_camera(item),
        )

    if item_type == "EXPLICIT_SURFACE":
        return new.MathItemExplicitSurface(
            id=item_id,
            type="EXPLICIT_SURFACE",
            properties=translate_explicit_surface(item),
        )

    if item_type == "EXPLICIT_SURFACE_POLAR":
        return new.MathItemExplicitSurfacePolar(
            id=item_id,
            type="EXPLICIT_SURFACE_POLAR",
            properties=translate_explicit_surface_polar(item),
        )

    if item_type == "FOLDER":
        return new.MathItemFolder(
            id=item_id,
            type="FOLDER",
            properties=translate_folder(item),
        )

    if item_type == "GRID":
        return new.MathItemGrid(
            id=item_id,
            type="GRID",
            properties=translate_grid(item),
        )

    if item_type == "IMPLICIT_SURFACE":
        return new.MathItemImplicitSurface(
            id=item_id,
            type="IMPLICIT_SURFACE",
            properties=translate_implicit_surface(item),
        )

    if item_type == "LINE":
        return new.MathItemImplicitSurface(
            id=item_id,
            type="LINE",
            properties=translate_line(item),
        )

    if item_type == "PARAMETRIC_CURVE":
        return new.MathItemParametricCurve(
            id=item_id,
            type="PARAMETRIC_CURVE",
            properties=translate_parametric_curve(item),
        )

    if item_type == "PARAMETRIC_SURFACE":
        return new.MathItemParametricSurface(
            id=item_id,
            type="PARAMETRIC_SURFACE",
            properties=translate_parametric_surface(item),
        )

    if item_type == "POINT":
        return new.MathItemPoint(
            id=item_id,
            type="POINT",
            properties=translate_point(item),
        )

    if item_type == "VARIABLE":
        return new.MathItemVariable(
            id=item_id,
            type="VARIABLE",
            properties=translate_variable(item),
        )

    if item_type == "VARIABLE_SLIDER":
        return new.MathItemVariableSlider(
            id=item_id,
            type="VARIABLE_SLIDER",
            properties=translate_variable_slider(item),
        )

    if item_type == "VECTOR":
        return new.MathItemVector(
            id=item_id,
            type="VECTOR",
            properties=translate_vector(item),
        )

    if item_type == "VECTOR_FIELD":
        return new.MathItemVectorField(
            id=item_id,
            type="VECTOR_FIELD",
            properties=translate_vector_field(item),
        )

    raise NotImplementedError(f"Unknown item type: {item['type']}")
