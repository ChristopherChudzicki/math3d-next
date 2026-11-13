/** At or above this denominator, a fraction is left to the principal root. */
const MAX_DENOMINATOR = 100;

type Sign = -1 | 0 | 1;

const findSign = (y: number): Sign => {
  const target = Math.abs(y);
  // Continued-fraction convergents p/q of |y|, smallest denominator first.
  let [p0, p, q0, q] = [0, 1, 1, 0];
  let rest = target;
  while (Number.isFinite(rest)) {
    const whole = Math.floor(rest);
    [p0, p] = [p, whole * p + p0];
    [q0, q] = [q, whole * q + q0];
    if (q >= MAX_DENOMINATOR) return 0;
    if (Math.abs(p / q - target) <= 4 * Number.EPSILON * target) {
      if (q % 2 === 0) return 0;
      return p % 2 === 0 ? 1 : -1;
    }
    rest = 1 / (rest - whole);
  }
  return 0;
};

let lastY = NaN;
let lastSign: Sign = 0;

/**
 * For a negative x, the sign of the real value of x^y, which is then that
 * sign times |x|^y: (-1)^p when y is a fraction p/q with q odd and below
 * MAX_DENOMINATOR. Otherwise 0: no real value to prefer.
 *
 * y arrives as a float, so "is p/q" means within rounding of it: 1/3,
 * 1 - 2/3 and 0.2 all qualify.
 */
const realRootSign = (y: number): Sign => {
  // A graph raises every sample to the same power, so the last answer is
  // usually the one wanted.
  if (y !== lastY) {
    lastY = y;
    lastSign = findSign(y);
  }
  return lastSign;
};

export { realRootSign };
