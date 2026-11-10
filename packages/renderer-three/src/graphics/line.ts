import { Group } from "three/webgpu";
import type { LineSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import type { Graphic } from "./builders";

/** Lines, vectors, parametric curves and vector fields. */
export const buildLine = (spec: LineSpec): Graphic<LineSpec> => {
  const stroke = new Stroke();
  stroke.set(spec.paths, spec);
  return {
    object: new Group().add(...stroke.objects),
    update: (next) => stroke.set(next.paths, next),
    dispose: () => stroke.dispose(),
  };
};
