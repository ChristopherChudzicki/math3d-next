import { Group } from "three/webgpu";
import type { PointSpec } from "@math3d/viewport-spec";
import { Discs } from "../point/Discs";
import { Labels } from "../label/Labels";
import type { Graphic } from "./builders";
import { ITEM_LABEL } from "./itemLabel";

// MathBox's `optical` circle, on by default, is drawn this many times `size`.
const MATHBOX_CIRCLE_SCALE = 1.2;

/** Points, each with the item's label. */
export const buildPoint = (spec: PointSpec): Graphic<PointSpec> => {
  const discs = new Discs();
  const labels = new Labels();
  // After the discs' fill and rims.
  labels.mesh.renderOrder = 2;
  const set = (next: PointSpec) => {
    discs.set(next.positions, {
      ...next,
      diameter: MATHBOX_CIRCLE_SCALE * next.size,
    });
    labels.set(next.positions, next.label, ITEM_LABEL);
  };
  set(spec);
  return {
    object: new Group().add(...discs.objects, labels.mesh),
    update: set,
    dispose: () => {
      discs.dispose();
      labels.dispose();
    },
  };
};
