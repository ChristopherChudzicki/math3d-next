import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { Coords } from "@/features/viewport/shared/coordinates";
import type { GraphicSpec } from "./types";
import { useLineStyle } from "./line";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const PROPS = ["components", "tail"] as const;

const Vector: SpecComponent<MIT.Vector> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { components, tail } = useMathItemResults(scope, item, PROPS);
  const style = useLineStyle(scope, item);
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !components || !tail) return null;
    const head = tail.map((t, i) => t + components[i]) as Coords;
    return { kind: "line", paths: [[tail, head]], ...style };
  }, [visible, components, tail, style]);
  useReportSpec(item.id, spec);
  return null;
};

export default Vector;
