import { linearTicks } from "./ticks";

test.each([
  { range: [-2.3, 3.7], divisions: 5, ticks: [-2, -1, 0, 1, 2, 3] },
  { range: [-1, 1], divisions: 4, ticks: [-1, -0.5, 0, 0.5, 1] },
] as const)(
  "nice ticks in $range by $divisions step by a round number, as in MathBox",
  ({ range, divisions, ticks }) => {
    expect(linearTicks(range, divisions, { zero: true, nice: true })).toEqual(
      ticks,
    );
  },
);

test("nice ticks are exact decimals, with a tick on each range end", () => {
  expect(linearTicks([-0.7, 0.7], 14, { zero: true, nice: true })).toEqual([
    -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6,
    0.7,
  ]);
});

test("an ideal step of exactly a power of ten is the step", () => {
  const ticks = linearTicks([0, 10000], 10, { zero: true, nice: true });
  expect(ticks).toHaveLength(11);
  expect(ticks[1]).toBe(1000);
});

test("nice ticks stay inside the range when no step fits", () => {
  expect(linearTicks([1, 4], 1, { zero: true, nice: true })).toEqual([]);
});

test("zero: false drops the tick at zero", () => {
  expect(linearTicks([-2, 3], 5, { zero: false, nice: true })).toEqual([
    -2, -1, 1, 2, 3,
  ]);
});

test("without nice, ticks divide the range evenly", () => {
  expect(linearTicks([0, 1], 3, { zero: true, nice: false })).toEqual([
    0,
    1 / 3,
    2 / 3,
    1,
  ]);
});
