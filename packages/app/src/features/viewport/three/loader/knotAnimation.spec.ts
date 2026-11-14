import { createKnotAnimation, evenlySpaced } from "./knotAnimation";

test("spaces samples evenly by arc length, whatever the parameter's speed", () => {
  // A unit circle whose parameter runs three times faster in places.
  const circle = (t: number): [number, number, number] => {
    const angle = t + 0.5 * Math.sin(t);
    return [Math.cos(angle), Math.sin(angle), 0];
  };
  const points = evenlySpaced(circle, 100);
  const chords = points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  expect(Math.max(...chords) / Math.min(...chords)).toBeLessThan(1.01);
});

test("held still, redraws only when the knot changes", () => {
  const clearRect = vi.fn();
  const ctx = new Proxy(
    { clearRect },
    {
      get: (target, key) => (key === "clearRect" ? target.clearRect : () => {}),
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  const knot = createKnotAnimation(ctx, {
    width: 200,
    height: 200,
    background: [255, 255, 255],
    ink: [0, 0, 0],
    still: true,
  });
  for (let frame = 0; frame < 10; frame += 1) knot.draw(1 / 60);
  expect(clearRect).toHaveBeenCalledTimes(1);

  knot.setStage("done");
  knot.draw(1 / 60);

  expect(clearRect).toHaveBeenCalledTimes(2);
});
