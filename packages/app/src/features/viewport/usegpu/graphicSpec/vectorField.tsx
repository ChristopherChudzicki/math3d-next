import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "./types";
import { useLineStyle } from "./line";
import { sampleVectorField } from "./sampleVectorField";
import { useReportSpec } from "./collector";
import type { SpecComponent } from "./collector";

const PROPS = [
  "expr",
  "domain",
  "samples1",
  "samples2",
  "samples3",
  "scale",
] as const;

const VectorField: SpecComponent<MIT.VectorField> = ({ item }) => {
  const scope = useMathScope();
  const visible = useFinalVisibility(scope, item);
  const {
    expr,
    domain,
    samples1,
    samples2,
    samples3,
    // MathBox's VectorField falls back to 0.5, not the item config's 1.
    scale = 0.5,
  } = useMathItemResults(scope, item, PROPS);
  const style = useLineStyle(scope, item, 2);
  const spec = useMemo<GraphicSpec | null>(() => {
    if (!visible || !expr || !domain) return null;
    // As MathBox does: counts round, and a missing or sub-1 count draws nothing.
    const counts = [samples1, samples2, samples3].map((n) =>
      n === undefined ? 0 : Math.round(n),
    );
    if (counts.some((n) => n < 1)) return null;
    const samples = counts as [number, number, number];
    return {
      kind: "line",
      paths: sampleVectorField(expr, domain, samples, scale),
      ...style,
    };
  }, [visible, expr, domain, samples1, samples2, samples3, scale, style]);
  useReportSpec(item.id, spec);
  return null;
};

export default VectorField;
