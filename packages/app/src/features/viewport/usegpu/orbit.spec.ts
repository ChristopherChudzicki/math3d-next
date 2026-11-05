import { makeOrbitPosition } from "@use-gpu/core";
import type { Coords } from "@/features/viewport/shared/coordinates";
import { fromOrbit, keyLightPosition, toOrbit, toWorld } from "./orbit";

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

test("keyLightPosition is MathBox's view-space (1, 2, 2) in world coordinates", () => {
  // Bearing and pitch 0: the camera sits on world +z, so view space is world space.
  const light = keyLightPosition({
    radius: 3,
    bearing: 0,
    pitch: 0,
    target: [0, 0, 0],
  });
  [1, 2, 2].forEach((v, i) => expect(light[i]).toBeCloseTo(v, 6));
});

// At a pole the view's x falls back to world +x, so y = z × x.
test.each([
  { pitch: Math.PI / 2, expected: [1, 2, -2] },
  { pitch: -Math.PI / 2, expected: [1, -2, 2] },
])(
  "keyLightPosition at pitch $pitch uses world +x as the view's x",
  ({ pitch, expected }) => {
    const light = keyLightPosition({
      radius: 3,
      bearing: 0,
      pitch,
      target: [0, 0, 0],
    });
    expected.forEach((v, i) => expect(light[i]).toBeCloseTo(v, 6));
  },
);
