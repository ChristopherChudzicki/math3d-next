import { Group } from "three/webgpu";
import type { PointSpec } from "@math3d/viewport-spec";
import { Discs } from "../point/Discs";
import { Labels } from "../label/Labels";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";
import { ITEM_LABEL } from "./itemLabel";

/** Points, each with the item's label. */
export const buildPoint = (
  spec: PointSpec,
  transparency: Transparency,
): Graphic<PointSpec> => {
  const discs = new Discs(transparency);
  const labels = new Labels(transparency);
  // After the discs' fill and rims.
  labels.mesh.renderOrder = 2;
  const set = (next: PointSpec) => {
    discs.set(next.positions, { ...next, diameter: next.size });
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
