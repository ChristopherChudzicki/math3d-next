import { makeOrbitPosition } from "@use-gpu/core";
import type { Coords } from "@/features/viewport/shared/coordinates";
import { toOrbit, toWorld } from "./orbit";

const cases: { position: Coords; target: Coords }[] = [
  { position: [0.5, -2, 0.5], target: [0, 0, 0] },
  { position: [-1.2, 0.8, 2], target: [0.3, 0.1, -0.4] },
  { position: [0, 0, 3], target: [0, 0, 0] },
  { position: [2, 2, -1], target: [1, 1, 1] },
];

test.each(cases)(
  "toOrbit puts Use.GPU's orbit camera where the math3d camera is: $position → $target",
  ({ position, target }) => {
    const orbit = toOrbit({ position, target });
    const placed = makeOrbitPosition(
      orbit.radius,
      orbit.bearing,
      orbit.pitch,
      orbit.target,
    );
    const expected = toWorld(position);
    expect(placed[0]).toBeCloseTo(expected[0], 6);
    expect(placed[1]).toBeCloseTo(expected[1], 6);
    expect(placed[2]).toBeCloseTo(expected[2], 6);
  },
);
