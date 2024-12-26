import { expect, test, describe } from "vitest";
import * as mathjs from "mathjs";
import { faker } from "@faker-js/faker/locale/en";
import { validators } from "./validators";

const expectFuncsEqual = (
  f1: (...args: number[]) => void,
  f2: (...args: number[]) => void,
) => {
  const sample = Array.from({ length: 10 }, () => faker.number.float());
  expect(f1(...sample)).toEqual(f2(...sample));
};

describe("realFunc", () => {
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
    const f11 = (x: unknown) => evaluate("f(x)=x^2")(x);
    const f21 = (x: unknown) => evaluate("f(x,y)=x^y")(x);
    const f12 = (x: unknown) => evaluate("f(x)=[x,sin(x)]")(x);
    const v11 = validators.realFunc[1][1];
    expectFuncsEqual(v11(f11), f11);

    expect(() => v11(f21)).toThrow(
      "Too few arguments in function f (expected: any, index: 1)",
    );
    expect(() => v11(f12)).toThrow(
      "Expected a function from R^1 -> R^1 (or C^1). Outputs are not real (or complex)",
    );

    const f23 = (x: unknown, y: unknown) =>
      evaluate("f(x, y)=[y^x,y^3, x^y]")(x, y);
    const f33 = (x: unknown, y: unknown, z: unknown) =>
      evaluate("f(x, y, z)=[cos(x*y),sin(x*y),tan(x*y)]")(x, y, z);
    const f22 = (x: unknown, y: unknown) => evaluate("f(x,y)=[x^y, y^x]")(x, y);

    const v23 = validators.realFunc[2][3];
    expectFuncsEqual(v23(f23), f23);
    expect(() => v23(f33)).toThrow(
      "Expected a function from R^2 -> R^3 (or C^3). This is not a function from R^2.",
    );
    expect(() => v23(f22)).toThrow(
      "Expected a function from R^2 -> R^3 (or C^3). Output has wrong number of components (2)",
    );
  });

  test("Non-real outputs converted to NaN", () => {
    const f = (x: unknown, y: unknown) => evaluate("f(x, y)=sqrt(x - y)")(x, y);
    const v = validators.realFunc[2][1](f);
    expect(v(5, 1)).toEqual(2);
    expect(v(1, 2)).toEqual(NaN);
  });
});
