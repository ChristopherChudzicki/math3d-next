/**
 * Whether two points agree up to the round-off of converting between UI and
 * three.js coordinates.
 */
const sameCoordinates = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      Math.abs(x - b[i]) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(b[i])),
  );

export default sameCoordinates;
