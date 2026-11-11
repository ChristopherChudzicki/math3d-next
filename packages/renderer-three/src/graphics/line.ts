import { Group } from "three/webgpu";
import type { LineSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import { Labels } from "../label/Labels";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";
import { ITEM_LABEL } from "./itemLabel";

/** Lines, vectors, parametric curves and vector fields. */
export const buildLine = (
  spec: LineSpec,
  transparency: Transparency,
): Graphic<LineSpec> => {
  const stroke = new Stroke(transparency);
  const labels = new Labels(transparency);
  // After the stroke.
  labels.mesh.renderOrder = 1;
  const set = (next: LineSpec) => {
    stroke.set(next.paths, next);
    const end = next.paths.at(-1)?.at(-1);
    labels.set(end ? [end] : [], next.label, ITEM_LABEL);
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
