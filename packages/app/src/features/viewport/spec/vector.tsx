import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { Coords, GraphicSpec } from "@math3d/viewport-spec";
import { visibleLabel } from "./style";
import { useLineStyle } from "./line";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const PROPS = ["components", "tail", "labelVisible"] as const;

const Vector: SpecComponent<MIT.Vector> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { components, tail, labelVisible } = useMathItemResults(
    scope,
    item,
    PROPS,
  );
  const style = useLineStyle(scope, item);
  const { label } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !components || !tail) return null;
    const head = tail.map((t, i) => t + components[i]) as Coords;
    return {
      kind: "line",
      paths: [[tail, head]],
      ...style,
      label: visibleLabel(label, labelVisible),
    };
  }, [visible, components, tail, style, label, labelVisible]);
  useReportSpec(item.id, spec);
  return null;
};

export default Vector;
