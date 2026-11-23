import { useMemo } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { vectorValues } from "@/features/viewport/shared/vectorValues";
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
  // Apart from the style memo so a style-only change doesn't sample the
  // field again.
  const paths = useMemo(() => {
    if (!visible || !expr || !domain) return null;
    // MathBox rounds sample counts; a missing count acts as 0.
    const samples = [samples1, samples2, samples3].map((n) =>
      Math.round(n ?? 0),
    ) as [number, number, number];
    const values = vectorValues(expr, 3, 3);
    return sampleVectorField(expr, domain, samples, scale, values);
  }, [visible, expr, domain, samples1, samples2, samples3, scale]);
  const spec = useMemo<GraphicSpec | null>(
    () => paths && { kind: "line", paths, ...style, label: null },
    [paths, style],
  );
  useReportSpec(item.id, spec);
  return null;
};

export default VectorField;
