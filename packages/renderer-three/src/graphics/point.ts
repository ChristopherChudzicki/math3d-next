import { Group } from "three/webgpu";
import type { PointSpec } from "@math3d/viewport-spec";
import { Discs } from "../point/Discs";
import { Labels } from "../label/Labels";
import type { LabelStyle } from "../label/Labels";
import type { Graphic } from "./builders";

/** Where math3d's MathBox point labels land. */
const LABEL_STYLE: LabelStyle = { weight: "bold", offset: [0, 24] };

/** Points, each with the item's label. */
export const buildPoint = (spec: PointSpec): Graphic<PointSpec> => {
  const discs = new Discs();
  const labels = new Labels();
  // After the discs' fill and rims.
  labels.mesh.renderOrder = 2;
  const set = (next: PointSpec) => {
    discs.set(next.positions, next);
    labels.set(next.positions, next.label, LABEL_STYLE);
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
