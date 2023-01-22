import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@/configs";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";

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
const Axis: React.FC<{ item: MathItem<MathItemType.Axis> }> = ({ item }) => {
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
        end={end}
        start={start}
        size={size}
      />
      <MB.Scale axis={axis} divide={divisions} zero={false} />
      {ticksVisible && (
        <MB.Group>
          <MB.Ticks color={color} width={2} />
          <MB.Format digits={2} />
          <MB.Label {...tickLabelProps} />
        </MB.Group>
      )}
      {labelVisible && (
        <MB.Group>
          <MB.Array live={false} channels={3} data={labelPosData} />
          <MB.Text live={false} data={[label]} />
          <MB.Label offset={LABEL_OFFSET} />
        </MB.Group>
      )}
    </MB.Group>
  );
};

export default Axis;
