/**
 * A tick value as MathBox's `<Format digits={2}>` writes it: rounded to two
 * significant digits, then printed as a JavaScript number ("1200", "0.33",
 * "1e-7").
 */
export const formatTick = (value: number): string =>
  String(+value.toPrecision(2));
