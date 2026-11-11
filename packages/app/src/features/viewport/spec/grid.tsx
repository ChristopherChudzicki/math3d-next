import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import useAxesInfo from "@/features/viewport/shared/useAxesInfo";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { baseStyle } from "./style";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";
import { linearTicks } from "./ticks";

const GRID_PROPS = [
  "divisions",
  "width",
  "opacity",
  "zBias",
  "zIndex",
  "snap",
] as const;

const AXES = ["axis-x", "axis-y", "axis-z"];

const AXIS_INDEX = { x: 0, y: 1, z: 2 } as const;

const Grid: SpecComponent<MIT.Grid> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { divisions, width, opacity, zBias, zIndex, snap } = useMathItemResults(
    scope,
    item,
    GRID_PROPS,
  );
  const [x, y, z] = useAppSelector((state) => select.getItems(state, AXES));
  const { range: axesRange } = useAxesInfo(x, y, z);
  const { color, axes } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible) return null;
    const [first, second] = [...axes] as (keyof typeof AXIS_INDEX)[];
    const range: [[number, number], [number, number]] = [
      axesRange[AXIS_INDEX[first]],
      axesRange[AXIS_INDEX[second]],
    ];
    const split: [number, number] = [
      divisions?.[0] ?? 10,
      divisions?.[1] ?? 10,
    ];
    const valuesAlong = (i: 0 | 1) =>
      linearTicks(range[i], split[i], { zero: true, nice: !!snap });
    return {
      kind: "grid",
      axes,
      range,
      divisions: split,
      snap: !!snap,
      values: [valuesAlong(0), valuesAlong(1)],
      width: width ?? 1,
      ...baseStyle({ opacity, zBias, zIndex }, color),
    };
  }, [
    visible,
    axes,
    axesRange,
    divisions,
    snap,
    width,
    color,
    opacity,
    zBias,
    zIndex,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

export default Grid;
