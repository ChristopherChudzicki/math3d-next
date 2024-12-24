import { expect, test, describe } from "vitest";
import * as mathjs from "mathjs";
import { validators } from "./validators";

describe("realDomainFunc", () => {
  const evaluate = (expr: string) => {
    const fOrig = mathjs.evaluate(expr);
    const f = (...args: unknown[]) => {
      const out = fOrig(...args);
      if (mathjs.isMatrix(out)) {
        return out.toArray();
      }
      return out;
    };
    return f;
  };
  test("Requires domain to be R^n", () => {
    const f11 = (x: unknown) => evaluate("f(x)=sqrt(-1)")(x);
    const f21 = (x: unknown) => evaluate("f(x,y)=sqrt(-1)")(x);
    const f12 = (x: unknown) => evaluate("f(x)=[sqrt(-1), 1]")(x);
    const v11 = validators.realDomainFunc[1][1];
    expect(v11(f11)).toBe(f11);
    expect(() => v11(f21)).toThrow(
      "Too few arguments in function f (expected: any, index: 1)",
    );
    expect(() => v11(f12)).toThrow(
      "Expected a function from R^1 -> R^1 (or C^1). Outputs are not real (or complex)",
    );

    const f23 = (x: unknown, y: unknown) =>
      evaluate("f(x, y)=[sqrt(-1),1,sqrt(-4)]")(x, y);
    const f33 = (x: unknown, y: unknown, z: unknown) =>
      evaluate("f(x, y, z)=[sqrt(-1),1,sqrt(-4)]")(x, y, z);
    const f22 = (x: unknown, y: unknown) =>
      evaluate("f(x,y)=[sqrt(-1), 1]")(x, y);

    const v23 = validators.realDomainFunc[2][3];
    expect(v23(f23)).toBe(f23);
    expect(() => v23(f33)).toThrow(
      "Expected a function from R^2 -> R^3 (or C^3). This is not a function from R^2.",
    );
    expect(() => v23(f22)).toThrow(
      "Expected a function from R^2 -> R^3 (or C^3). Output has wrong number of components (2)",
    );
  });
});
