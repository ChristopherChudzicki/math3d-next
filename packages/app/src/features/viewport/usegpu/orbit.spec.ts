import { makeOrbitPosition } from "@use-gpu/core";
import type { Coords } from "@/features/viewport/shared/coordinates";
import { fromOrbit, toOrbit, toWorld } from "./orbit";

const cases: { position: Coords; target: Coords }[] = [
  { position: [-1.2, 0.8, 2], target: [0.3, 0.1, -0.4] },
  // A pole: straight above the target.
  { position: [0, 0, 3], target: [0, 0, 0] },
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

test.each(cases)(
  "fromOrbit inverts toOrbit: $position → $target",
  ({ position, target }) => {
    const back = fromOrbit(toOrbit({ position, target }));
    [0, 1, 2].forEach((i) => {
      expect(back.position[i]).toBeCloseTo(position[i], 6);
      expect(back.target[i]).toBeCloseTo(target[i], 6);
    });
  },
);
