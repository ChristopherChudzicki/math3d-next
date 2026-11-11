import { linearTicks } from "./ticks";

// Expected values are MathBox 2.3.1's `linear` on the same arguments.
test.each([
  { range: [-2.3, 3.7], divisions: 5, ticks: [-2, -1, 0, 1, 2, 3] },
  { range: [-1, 1], divisions: 4, ticks: [-1, -0.5, 0, 0.5, 1] },
] as const)(
  "nice ticks in $range by $divisions step by a round number",
  ({ range, divisions, ticks }) => {
    expect(linearTicks(range, divisions, { zero: true, nice: true })).toEqual(
      ticks,
    );
  },
);

test("nice ticks step by 500 where the ideal step is exactly 1000, as in MathBox", () => {
  const ticks = linearTicks([0, 10000], 10, { zero: true, nice: true });
  expect(ticks.slice(0, 3)).toEqual([0, 500, 1000]);
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
