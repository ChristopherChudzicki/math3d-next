import React, { useCallback } from "react";
import * as MB from "mathbox-react";
import type { IntervalEmitter } from "mathbox";
import { MathItemType } from "@math3d/mathitem-configs";
import { useSelector } from "react-redux";
import { select, useMathScope } from "../../sceneControls/mathItems/sceneSlice";
import {
  useFinalVisibility,
  useMathItemResults,
} from "../../sceneControls/mathItems/mathScope";
import { GraphicComponent } from "./interfaces";

const props = [
  "opacity",
  "size",
  "width",
  "zBias",
  "zIndex",
  "zOrder",
  "start",
  "end",
  "samples1",
  "domain",
  "expr",
] as const;

const RANGE = [0, 1];
const ParametricCurve: GraphicComponent<MathItemType.ParametricCurve> = ({
  item,
}) => {
  const scope = useMathScope();
  const defaultZOrder = useSelector(select.defaultGraphicOrder);
  const { color } = item.properties;
  const {
    opacity,
    size,
    width,
    zBias,
    zIndex,
    zOrder = defaultZOrder[item.id],
    start,
    end,
    samples1,
    domain,
    expr,
  } = useMathItemResults(scope, item, props);

  const emitter: IntervalEmitter = useCallback(
    (emit, t) => {
      if (!expr) return;
      if (!domain) return;
      const [t1, t2] = domain[0];
      const [x, y, z] = expr(t1 + (t2 - t1) * t);
      emit(+x, +y, +z);
    },
    [expr, domain],
  );
  const finalVisibility = useFinalVisibility(scope, item);

  return !finalVisibility ? null : (
    <MB.Group>
      <MB.Interval
        live={false}
        expr={emitter}
        width={samples1}
        channels={3}
        range={RANGE}
      />
      <MB.Line
        color={color}
        width={width}
        start={start}
        end={end}
        opacity={opacity}
        size={size}
        zBias={zBias}
        zIndex={zIndex}
        zOrder={zOrder}
      />
    </MB.Group>
  );
};

export default ParametricCurve;
