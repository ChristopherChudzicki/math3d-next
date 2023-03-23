import { factory } from "mathjs";

const EPS = 0.0008;
const EPS2 = EPS / 2;

type Numeric = number | Numeric[];

type NumericFunction = (...args: Numeric[]) => Numeric;

const createTotalDerivative = factory(
  "diff",
  ["add", "subtract", "multiply", "divide"],
  ({ add, subtract, divide }) => {
    const totalDerivative = (f: NumericFunction, ...sample: Numeric[]) => {
      const df = (...args: Numeric[]): Numeric => {
        const copy = [...args];
        const derivComponents = copy.map((arg, j) => {
          // @ts-expect-error the MathJS types only support numeric to matrices
          copy[j] = add(arg, -EPS2);
          const initialValue = f(...copy);
          // @ts-expect-error the MathJS types only support numeric to matrices
          copy[j] = add(arg, +EPS2);
          const finalValue = f(...copy);
          // @ts-expect-error the MathJS types only support numeric to matrices
          const out: Numeric = divide(subtract(finalValue, initialValue), EPS);
          return out;
        });
        return derivComponents.length === 1
          ? derivComponents[0]
          : derivComponents;
      };

      Object.defineProperty(df, "length", { value: f.length });

      if (sample.length === 0) {
        return df;
      }
      return df(...sample);
    };
    return totalDerivative;
  }
);

type FuncR3 = (t: number) => number[];
const createUnitT = factory(
  "unitT",
  ["subtract", "divide", "norm"],
  ({ subtract, divide, norm }) => {
    const unitT = (f: FuncR3, t: number): number[] => {
      const f1 = f(t - EPS2);
      const f2 = f(t + EPS2);
      const diff = subtract(f2, f1);
      const out = divide(diff, norm(diff));
      return out as number[];
    };
    return unitT;
  }
);

const createUnitN = factory(
  "unitN",
  // @ts-expect-error MathJS Types only know about builtin functions
  ["subtract", "divide", "norm", "unitT"],
  // @ts-expect-error MathJS Types do not know about unitT
  ({ subtract, divide, norm, unitT }) => {
    const unitN = (f: FuncR3, t: number): number[] => {
      const normal = subtract(unitT(f, t + EPS2), unitT(f, t - EPS2));
      return divide(normal, norm(normal)) as number[];
    };
    return unitN;
  }
);

const createUnitB = factory(
  "unitB",
  // @ts-expect-error MathJS Types only know about builtin functions
  ["cross", "unitT", "unitN"],
  // @ts-expect-error MathJS Types do not know about unitT
  ({ cross, unitT, unitN }) => {
    const unitB = (f: FuncR3, t: number): number[] => {
      return cross(unitT(f, t), unitN(f, t)) as number[];
    };
    return unitB;
  }
);

export { createTotalDerivative, createUnitT, createUnitN, createUnitB };
