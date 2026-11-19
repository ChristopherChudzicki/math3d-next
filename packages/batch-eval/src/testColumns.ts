/** Values where float arithmetic has special cases. */
export const SPECIAL = [
  0,
  -0,
  1,
  -1,
  0.5,
  -2.5,
  1e300,
  1e-300,
  NaN,
  Infinity,
  -Infinity,
];

/** A seeded generator (Park–Miller) of doubles in [0, 1). */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
};

/** `n` doubles, half spread over ±1e3 and half over ±1e-3. */
export const randomDoubles = (n: number, seed: number): number[] => {
  const random = seeded(seed);
  return Array.from(
    { length: n },
    (_, i) => (2 * random() - 1) * (i % 2 === 0 ? 1e3 : 1e-3),
  );
};
