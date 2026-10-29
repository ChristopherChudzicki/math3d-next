import React, { useCallback } from "react";
import * as MB from "mathbox-react";
import type { VolumeEmitter } from "mathbox";
import { MathItemType } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useDefaultZOrder } from "@/store/scene/evaluation/useDefaultZOrder";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import { GraphicComponent } from "./interfaces";

const props = [
  "opacity",
  "zBias",
  "zIndex",
  "zOrder",
  "size",
  "width",
  "start",
  "end",
  "domain",
  "samples1",
  "samples2",
  "samples3",
  "scale",
  "expr",
] as const;

// MathBox spaces samples from range end to end, putting a lone sample at the
// minimum; centering puts it at the midpoint. MathBox rounds sample counts.
const isLone = (samples: number | undefined) =>
  samples !== undefined && Math.round(samples) === 1;

const Vector: GraphicComponent<MathItemType.VectorField> = ({ item }) => {
  const scope = useMathScope();
  const defaultZOrder = useDefaultZOrder(item.id);
  const { color } = item.properties;
  const {
    opacity,
    zBias,
    zIndex,
    zOrder = defaultZOrder,
    size,
    width,
    start,
    end,
    domain,
    samples1,
    samples2,
    samples3,
    scale = 0.5,
    expr,
  } = useMathItemResults(scope, item, props);

  const field: VolumeEmitter = useCallback(
    (emit, x, y, z) => {
      if (!expr) return;
      emit(x, y, z);
      const v = expr(x, y, z);
      const x2 = x + v[0] * scale;
      const y2 = y + v[1] * scale;
      const z2 = z + v[2] * scale;
      emit(x2, y2, z2);
    },
    [expr, scale],
  );

  const finalVisibility = useFinalVisibility(scope, item);
  return !finalVisibility ? null : (
    <MB.Group>
      <MB.Volume
        width={samples1}
        height={samples2}
        depth={samples3}
        channels={3} // x, y, z
        items={2} // [tail, head]
        rangeX={domain?.[0]}
        rangeY={domain?.[1]}
        rangeZ={domain?.[2]}
        centeredX={isLone(samples1)}
        centeredY={isLone(samples2)}
        centeredZ={isLone(samples3)}
        expr={field}
      />
      <MB.Vector
        width={width}
        zIndex={zIndex}
        zBias={zBias}
        size={size}
        start={start}
        end={end}
        opacity={opacity}
        color={color}
        zOrder={zOrder}
      />
    </MB.Group>
  );
};

export default Vector;
