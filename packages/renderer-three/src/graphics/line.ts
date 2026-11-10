import { Group } from "three/webgpu";
import type { LineSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import {
  Labels,
  MATHBOX_LABEL_COLOR,
  fromMathBoxOffset,
} from "../label/Labels";
import type { Graphic } from "./builders";

/** The offset math3d gives MathBox's line and vector labels. */
const LABEL_OFFSET = fromMathBoxOffset([0, 40]);

const setLabel = (labels: Labels, spec: LineSpec) => {
  const end = spec.paths.at(-1)?.at(-1);
  labels.set(end && spec.label !== null ? [end] : [], spec.label ?? "", {
    weight: "bold",
    color: MATHBOX_LABEL_COLOR,
    offset: LABEL_OFFSET,
    // math3d gives MathBox's label neither the item's zBias nor its zIndex.
    zBias: 0,
    zIndex: 0,
  });
};

/** Lines, vectors, parametric curves and vector fields. */
export const buildLine = (spec: LineSpec): Graphic<LineSpec> => {
  const stroke = new Stroke();
  const labels = new Labels();
  // After the line, as MathBox draws the label it adds after it.
  labels.mesh.renderOrder = 1;
  const set = (next: LineSpec) => {
    stroke.set(next.paths, next);
    setLabel(labels, next);
  };
  set(spec);
  return {
    object: new Group().add(...stroke.objects, labels.mesh),
    update: set,
    dispose: () => {
      stroke.dispose();
      labels.dispose();
    },
  };
};
