import { factory } from "mathjs";
import {
  getUserFunctionSignature,
  setUserFunctionSignature,
  spreadPoint,
  spreadVector,
} from "./userFunctions";

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
        const copy = [...spreadPoint(f, args)] as Numeric[];
        const derivComponents = copy.map((arg, j) => {
          // @ts-expect-error the MathJS types only support numeric to matrices
          copy[j] = add(arg, -EPS2);
          const initialValue = f(...copy);
          // @ts-expect-error the MathJS types only support numeric to matrices
          copy[j] = add(arg, +EPS2);
          const finalValue = f(...copy);
          copy[j] = arg;
          // @ts-expect-error the MathJS types only support numeric to matrices
          const out: Numeric = divide(subtract(finalValue, initialValue), EPS);
          return out;
        });
        return derivComponents.length === 1
          ? derivComponents[0]
          : derivComponents;
      };

      Object.defineProperty(df, "length", { value: f.length });
      const signature = getUserFunctionSignature(f);
      if (signature) setUserFunctionSignature(df, signature);

      if (sample.length === 0) {
        return df;
      }
      return df(...sample);
    };
    return totalDerivative;
  },
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
  },
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
  },
);

const createUnitB = factory(
  "unitB",
  // @ts-expect-error MathJS Types only know about builtin functions
  ["cross", "unitT", "unitN"],
  // @ts-expect-error MathJS Types do not know about unitT
  ({ cross, unitT, unitN }) => {
    const unitB = (f: FuncR3, t: number): number[] =>
      cross(unitT(f, t), unitN(f, t)) as number[];
    return unitB;
  },
);

// The instance's `diff` is createTotalDerivative, but the MathJS types describe
// the builtin `diff` (differences between array entries) it replaces.
type TotalDerivative = (
  f: (...args: number[]) => Numeric,
  ...sample: number[]
) => Numeric;

type FuncR3R3 = (x: number, y: number, z: number) => number[];
const createCurl = factory("curl", ["diff"], ({ diff }) => {
  const totalDerivative = diff as unknown as TotalDerivative;
  const curl = (f: FuncR3R3, ...point: unknown[]): number[] => {
    const coordinates = spreadVector(3, point) as number[];
    if (coordinates.length !== 3) {
      throw new Error(
        "curl(F, x, y, z) needs 3 coordinates, or one point [x, y, z]",
      );
    }
    const [x, y, z] = coordinates;
    const jacobian = totalDerivative(f, x, y, z) as number[][];
    if (!jacobian.every((row) => Array.isArray(row) && row.length === 3)) {
      throw new Error("curl(F, x, y, z) requires F to return a 3-vector.");
    }
    const [dxf, dyf, dzf] = jacobian;
    return [dyf[2] - dzf[1], dzf[0] - dxf[2], dxf[1] - dyf[0]];
  };
  return curl;
});

const createDivergence = factory(
  "div",
  ["diff", "trace"],
  ({ diff, trace }) => {
    const totalDerivative = diff as unknown as TotalDerivative;
    const div = (f: NumericFunction, ...sample: number[]): number =>
      trace(totalDerivative(f, ...sample) as number[][]);
    return div;
  },
);

export {
  createTotalDerivative,
  createUnitT,
  createUnitN,
  createUnitB,
  createCurl,
  createDivergence,
};
