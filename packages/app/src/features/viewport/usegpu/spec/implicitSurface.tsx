import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "./types";
import { parseColor } from "./types";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const IMPLICIT_PROPS = [
  "lhs",
  "rhs",
  "domain",
  "samples",
  "opacity",
  "shaded",
  "zBias",
  "zIndex",
] as const;

const ImplicitSurface: SpecComponent<MIT.ImplicitSurface> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const { lhs, rhs, domain, samples, opacity, shaded, zBias, zIndex } =
    useMathItemResults(scope, item, IMPLICIT_PROPS);
  const { color } = item.properties;
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !lhs || !rhs || !domain) return null;
    return {
      kind: "implicit",
      domain,
      samples: Math.max(2, Math.round(samples ?? 20)),
      value: (x, y, z) => lhs(x, y, z) - rhs(x, y, z),
      color: parseColor(color, opacity ?? 1),
      shaded: shaded ?? true,
      zBias: zBias ?? 0,
      zIndex: zIndex ?? 0,
    };
  }, [
    visible,
    lhs,
    rhs,
    domain,
    samples,
    color,
    opacity,
    shaded,
    zBias,
    zIndex,
  ]);
  useReportSpec(item.id, spec);
  return null;
};

export default ImplicitSurface;
