import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";
import { GraphicComponent } from "./interfaces";

const props = [
  "visible",
  "labelVisible",
  "ticksVisible",
  "opacity",
  "width",
  "zIndex",
  "zBias",
  "start",
  "end",
  "size",
  "divisions",
  "max",
] as const;

const LABEL_OFFSET = [0, 30, 0];
const Axis: GraphicComponent<MathItemType.Axis> = ({ item, zOrder }) => {
  const scope = useMathScope();
  const { color, axis, label } = item.properties;
  const {
    visible,
    opacity,
    width,
    zIndex,
    zBias,
    start,
    end,
    max,
    size,
    divisions,
    ticksVisible,
    labelVisible,
  } = useMathItemResults(scope, item, props);
  const tickLabelProps = axis === "z" ? { offset: [20, 0, 0] } : {};
  const labelPosData = useMemo(() => {
    if (axis === "x") return [max, 0, 0];
    if (axis === "y") return [0, max, 0];
    if (axis === "z") return [0, 0, max];
    return [];
  }, [axis, max]);
  return !visible ? null : (
    <MB.Group>
      <MB.Axis
        axis={axis}
        color={color}
        width={width}
        opacity={opacity}
        visible={visible}
        zIndex={zIndex}
        zBias={zBias}
        zOrder={zOrder}
        end={end}
        start={start}
        size={size}
      />
      <MB.Scale axis={axis} divide={divisions} zero={false} />
      {ticksVisible && (
        <MB.Group>
          <MB.Ticks color={color} width={2} zOrder={zOrder} />
          <MB.Format digits={2} />
          <MB.Label {...tickLabelProps} zOrder={zOrder} />
        </MB.Group>
      )}
      {labelVisible && (
        <MB.Group>
          <MB.Array live={false} channels={3} data={labelPosData} />
          <MB.Text live={false} data={[label]} />
          <MB.Label offset={LABEL_OFFSET} zOrder={zOrder} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Axis;
