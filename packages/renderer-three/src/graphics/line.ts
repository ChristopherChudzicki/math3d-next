import { Group } from "three/webgpu";
import type { LineSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import { Labels } from "../label/Labels";
import type { LabelStyle } from "../label/Labels";
import type { Graphic } from "./builders";

/** As math3d gives MathBox's line and vector labels. */
const LABEL_STYLE: LabelStyle = { weight: "bold", offset: [0, 40] };

/** Lines, vectors, parametric curves and vector fields. */
export const buildLine = (spec: LineSpec): Graphic<LineSpec> => {
  const stroke = new Stroke();
  const labels = new Labels();
  const set = (next: LineSpec) => {
    stroke.set(next.paths, next);
    const end = next.paths.at(-1)?.at(-1);
    labels.set(end ? [end] : [], next.label, LABEL_STYLE);
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
