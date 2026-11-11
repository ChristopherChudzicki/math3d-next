export type TickOptions = {
  /** Keep a tick at exactly zero. */
  zero: boolean;
  /** Snap the step to 1, 2 or 5 times a power of ten; else divide the range evenly. */
  nice: boolean;
};

/**
 * MathBox's `linear` ticks (`mathbox/src/util/ticks.js`, at its defaults for
 * everything but `zero` and `nice`): about `divisions` equally spaced values
 * in `[min, max]`. Floating-point error carries through as in MathBox, so a
 * tick meant to be zero can land a hair off it and survive `zero: false`.
 */
export const linearTicks = (
  [min, max]: readonly [number, number],
  divisions: number,
  { zero, nice }: TickOptions,
): number[] => {
  const n = divisions || 10;
  const ideal = (max - min) / n;
  let first = min;
  let step = ideal;
  let count = n;
  if (nice) {
    // Not `Math.log10`: MathBox's quotient gives 2.9999… for 1000, so its
    // ticks there step by 500, not 1000.
    const ref = 10 ** Math.floor(Math.log(ideal) / Math.log(10));
    // Of 5, 1 and ½ × ref, the step nearest `ideal` by ratio; the first wins a tie.
    let distance = Infinity;
    [5, 1, 0.5].forEach((factor) => {
      const candidate = ref * factor;
      const d = Math.max(candidate / ideal, ideal / candidate);
      if (d < distance) {
        distance = d;
        step = candidate;
      }
    });
    first = Math.ceil(min / step) * step;
    count = Math.ceil((Math.floor(max / step) * step - first) / step);
  }
  const ticks: number[] = [];
  for (let i = 0; i <= count; i += 1) ticks.push(first + i * step);
  return zero ? ticks : ticks.filter((x) => x !== 0);
};
