import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItemType } from "@math3d/mathitem-configs";
import { marchingCubes } from "@/util/marchingCubes";
import { useMathItemResults } from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/mathItemsSlice";
import { GraphicComponent } from "./interfaces";

const props = [
  "opacity",
  "domain",
  "shaded",
  "visible",
  "zBias",
  "zIndex",
  "lhs",
  "rhs",
  "domain",
  "samples",
] as const;

const ImplicitSurface: GraphicComponent<MathItemType.ImplicitSurface> = ({
  item,
  zOrder,
}) => {
  const scope = useMathScope();
  const { color } = item.properties;
  const { opacity, domain, shaded, visible, zBias, zIndex, lhs, rhs, samples } =
    useMathItemResults(scope, item, props);

  const data = useMemo(() => {
    if (!domain || !lhs || !rhs) return null;
    const implicitFunc = (x: number, y: number, z: number) =>
      lhs(x, y, z) - rhs(x, y, z);
    const implicitTriangles = marchingCubes(
      domain[0][0],
      domain[0][1],
      domain[1][0],
      domain[1][1],
      domain[2][0],
      domain[2][1],
      implicitFunc,
      0,
      samples
    );

    // "samples" really determines the field discretization length
    // true number of samples depends on discretization length and implicitFunc
    const trueSamplesNum = implicitTriangles.length;
    // Sample cap of 5400 was found experimentally; I do not really understand
    // what goes wrong when too many samples are generated.
    // This is... not great. Surface will silently disappear if too many
    // samples. Better than crashing. UseGPU would probably avoid this problem.
    if (trueSamplesNum > 5400) return [];

    return implicitTriangles;
  }, [lhs, rhs, domain, samples]);
  return !visible ? null : (
    <MB.Group>
      <MB.Array data={data} channels={3} items={3} width={0} live={false} />
      <MB.Strip
        color={color}
        opacity={opacity}
        shaded={shaded}
        zBias={zBias}
        zIndex={zIndex}
        zOrder={zOrder}
      />
    </MB.Group>
  );
};

export default ImplicitSurface;
