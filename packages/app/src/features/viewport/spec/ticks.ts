export type TickOptions = {
  /** Keep a tick at zero. */
  zero: boolean;
  /** Snap the step to 1, 2 or 5 times a power of ten; else divide the range evenly. */
  nice: boolean;
};

/** How far, in steps, a range end may miss a tick and still get it. */
const ON_TICK = 1e-9;

/**
 * About `divisions` equally spaced values in `[min, max]`: MathBox's `linear`
 * ticks (`mathbox/src/util/ticks.js`) at its defaults for everything but
 * `zero` and `nice`. It departs from MathBox where MathBox's floating point
 * goes wrong, and for negative `divisions`:
 * - A nice tick is an exact decimal: 0.3, not 0.30000000000000004.
 * - A range end on a tick keeps it: MathBox drops −0.7 from [−0.7, 0.7] in
 *   tenths.
 * - An ideal step of exactly a power of ten is the step: MathBox steps by 500
 *   over [0, 10000] in 10.
 * - No tick falls outside the range. MathBox's last nice tick can overshoot
 *   by a step ([−8.4, −8.239] in 5 gets −8.2), and with no nice step inside
 *   the range it counts backwards ([1, 4] in 1 gets [5, 0]).
 * - Negative `divisions` gives no ticks; without `nice`, MathBox divides as
 *   for their absolute value.
 */
export const linearTicks = (
  [min, max]: readonly [number, number],
  divisions: number,
  { zero, nice }: TickOptions,
): number[] => {
  const n = divisions || 10;
  const ideal = (max - min) / n;
  const ticks: number[] = [];
  if (!nice) {
    for (let i = 0; i <= n; i += 1) ticks.push(min + i * ideal);
  } else if (ideal > 0 && Number.isFinite(ideal)) {
    // The step is `mantissa` × 10^`power`: of 5, 1 and ½ times the power of
    // ten below `ideal`, the one nearest it by ratio; the first wins a tie.
    const below = Math.floor(Math.log10(ideal));
    const distance = ([m, e]: readonly [number, number]) => {
      const ratio = (m * 10 ** e) / ideal;
      return Math.max(ratio, 1 / ratio);
    };
    const candidates = [
      [5, below],
      [1, below],
      [5, below - 1],
    ] as const;
    const [mantissa, power] = candidates.reduce<readonly [number, number]>(
      (best, candidate) =>
        distance(candidate) < distance(best) ? candidate : best,
      candidates[0],
    );
    const step = mantissa * 10 ** power;
    // An integer over a power of ten is the nearest double to that decimal.
    const tick = (i: number) =>
      power >= 0 ? i * step : (i * mantissa) / 10 ** -power;
    const first = Math.ceil(min / step - ON_TICK);
    const last = Math.floor(max / step + ON_TICK);
    for (let i = first; i <= last; i += 1) ticks.push(tick(i));
  }
  return zero ? ticks : ticks.filter((x) => x !== 0);
};
