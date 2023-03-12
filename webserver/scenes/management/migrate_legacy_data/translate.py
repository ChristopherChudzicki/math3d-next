from typing import Any, Union

import scenes.management.migrate_legacy_data.legacy_data as old
import scenes.math_items as new


def stringify(obj: bool):
    if obj:
        return "true"
    else:
        return "false"


def get_visible(x: object) -> str:
    if hasattr(x, "useCalculatedVisibility") and x.useCalculatedVisibility:
        return x.calculatedVisibility
    return stringify(x.visible)


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
        use_relative=not x.useComputed,
        position=position,
        target=target,
        is_orthographic=x.isOrthographic,
        is_pan_enabled=x.isPanEnabled,
        is_zoom_enabled=x.isZoomEnabled,
        is_rotate_enabled=x.isRotateEnabled,
        update_on_drag=stringify(True),
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

    raise NotImplementedError(f"Unknown item type: {item['type']}")
