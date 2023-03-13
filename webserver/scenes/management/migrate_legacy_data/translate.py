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


def test_implicit_surface(props) -> new.ItemPropertiesImplicitSurface:
    pass


def test_line(props) -> new.ItemPropertiesLine:
    pass


def test_parametric_curve(props) -> new.ItemPropertiesParametricCurve:
    pass


def test_parametric_surface(props) -> new.ItemPropertiesParametricSurface:
    pass


def test_point(props) -> new.ItemPropertiesPoint:
    pass


def test_variable(props) -> new.ItemPropertiesVariable:
    pass


def test_variable_slider(props) -> new.ItemPropertiesVariableSlider:
    pass


def test_vector(props) -> new.ItemPropertiesVector:
    pass


def test_vector_field(props) -> new.ItemPropertiesVectorField:
    pass


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

    raise NotImplementedError(f"Unknown item type: {item['type']}")
