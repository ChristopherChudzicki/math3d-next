import { Group } from "three/webgpu";
import type { GridSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import { pointOn } from "./coords";
import type { AxisName } from "./coords";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

/** Gridlines across a plane through the origin, each spanning the plane's range. */
export const buildGrid = (
  spec: GridSpec,
  transparency: Transparency,
): Graphic<GridSpec> => {
  const stroke = new Stroke(transparency);
  const set = (next: GridSpec) => {
    const axes = [...next.axes] as AxisName[];
    const at = (u: number, v: number) => pointOn(axes, [u, v]);
    const [[min1, max1], [min2, max2]] = next.range;
    const [along1, along2] = next.values;
    stroke.set(
      [
        ...along2.map((v) => [at(min1, v), at(max1, v)]),
        ...along1.map((u) => [at(u, min2), at(u, max2)]),
      ],
      next,
    );
  };
  set(spec);
  return {
    object: new Group().add(...stroke.objects),
    update: set,
    dispose: () => stroke.dispose(),
  };
};
