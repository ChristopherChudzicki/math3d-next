import { Group } from "three/webgpu";
import type { Coords, GridSpec } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import { AXIS_INDEX } from "./axis";
import type { Graphic } from "./builders";

/** Gridlines across a plane through the origin, each spanning the plane's range. */
export const buildGrid = (spec: GridSpec): Graphic<GridSpec> => {
  const stroke = new Stroke();
  const set = (next: GridSpec) => {
    const [first, second] = [...next.axes] as (keyof typeof AXIS_INDEX)[];
    const at = (u: number, v: number): Coords => {
      const point: Coords = [0, 0, 0];
      point[AXIS_INDEX[first]] = u;
      point[AXIS_INDEX[second]] = v;
      return point;
    };
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
