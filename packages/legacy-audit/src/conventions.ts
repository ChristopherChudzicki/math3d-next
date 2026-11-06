/**
 * math3d-react conventions that a replay of the pass 2a evaluator swaps in, one
 * at a time, so pass 2c can show that a difference is the convention alone
 * (docs/legacy-audit/README.md). A replay evaluates only the scenes with a
 * trigger among their features. `install` returns its undo.
 */
import math from "@math3d/custom-mathjs";

type ComplexValue = { re: number; im: number };
type ComplexOp = (this: ComplexValue, a: unknown, b?: unknown) => ComplexValue;
type ComplexClass = {
  new (a: unknown, b?: unknown): ComplexValue;
  prototype: { add: ComplexOp; sub: ComplexOp };
};

const CONVENTIONS = {
  // react's mathjs 3 rounds a number with Math.round, so .5 goes toward +∞;
  // mathjs 15 rounds it away from zero. round(x, n) keeps mathjs 15's.
  round: {
    triggers: ["round"],
    install: () => {
      const { round } = math;
      math.import(
        {
          round: math.typed("round", {
            ...(round as unknown as { signatures: object }).signatures,
            number: Math.round,
          }),
        },
        { override: true },
      );
      return () => math.import({ round }, { override: true });
    },
  },
  // react's complex.js 2.0.4 adds and subtracts component-wise, so
  // -∞ + 0i stays (-∞, 0). 2.4.3 makes a sum with one infinite operand
  // Complex.INFINITY, (∞, ∞), and ∞ + ∞ NaN.
  complex_add: {
    triggers: ["arg", "re", "im", "abs", "norm", "conj", "sqrt", "exp"],
    install: () => {
      const { Complex } = math as unknown as { Complex: ComplexClass };
      const { add, sub } = Complex.prototype;
      Complex.prototype.add = function componentwiseAdd(a, b) {
        const z = new Complex(a, b);
        return new Complex(this.re + z.re, this.im + z.im);
      };
      Complex.prototype.sub = function componentwiseSub(a, b) {
        const z = new Complex(a, b);
        return new Complex(this.re - z.re, this.im - z.im);
      };
      return () => {
        Complex.prototype.add = add;
        Complex.prototype.sub = sub;
      };
    },
  },
} satisfies Record<string, { triggers: string[]; install: () => () => void }>;
type Convention = keyof typeof CONVENTIONS;

export { CONVENTIONS };
export type { Convention };
