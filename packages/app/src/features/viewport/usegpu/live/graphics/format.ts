/**
 * A tick value as a plain decimal with at most 3 places, trailing zeros
 * trimmed. MathBox uses two significant digits instead; plain decimals read
 * better for round tick values.
 */
export const formatTick = (value: number): string =>
  String(Number(value.toFixed(3)));
