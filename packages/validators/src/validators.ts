import * as yup from "yup";
import { aggregate } from "@math3d/utils";
import type { TupleOf } from "@math3d/utils";
import { isComplex } from "@math3d/mathjs-utils";
import type { Validator } from "./interfaces";

const firstArg = <A, B, C>(f: (a: A, b?: B) => C) => {
  return (x: A) => f(x);
};

/**
 * Allow all values as boolean, but coerce them.
 */
const boolean = (x: unknown) => !!x;

const num = yup.number().strict().required();
const array = yup.array().strict().required();

type Dim = 1 | 2 | 3 | 4;

type RealVectors = {
  1: [number];
  2: [number, number];
  3: [number, number, number];
  4: [number, number, number, number];
};

type Complex = { re: number; im: number };
type MaybeComplex = number | Complex;
type MaybeComplexVectors = {
  1: [MaybeComplex];
  2: [MaybeComplex, MaybeComplex];
  3: [MaybeComplex, MaybeComplex, MaybeComplex];
  4: [MaybeComplex, MaybeComplex, MaybeComplex];
};

export const real = num;

export const complex = yup.mixed().test({
  test: isComplex,
  message: "Expected a complex number",
});
export const maybeComplex = yup.mixed().test({
  test: (val) => typeof val === "number" || isComplex(val),
  message: "Expected a real or complex number",
});

const positive = real.positive();
const nonnegative = real.test({
  test: (x) => x >= 0,
  message: "Expected a nonnegative number.",
  name: "nonnegative",
});

const realVectors = {
  1: yup.tuple([num]).strict().required(),
  2: yup.tuple([num, num]).strict().required(),
  3: yup.tuple([num, num, num]).strict().required(),
  4: yup.tuple([num, num, num, num]).strict().required(),
};

const maybeComplexVectors = {
  1: yup.tuple([maybeComplex]).strict().required(),
  2: yup.tuple([maybeComplex, maybeComplex]).strict().required(),
  3: yup.tuple([maybeComplex, maybeComplex, maybeComplex]).strict().required(),
  4: yup
    .tuple([maybeComplex, maybeComplex, maybeComplex, maybeComplex])
    .strict()
    .required(),
};

type RealFuncs = {
  1: {
    1: (x: number) => number;
    2: (x: number) => RealVectors[2];
    3: (x: number) => RealVectors[3];
    4: (x: number) => RealVectors[4];
  };
  2: {
    1: (x: number, y: number) => number;
    2: (x: number, y: number) => RealVectors[2];
    3: (x: number, y: number) => RealVectors[3];
    4: (x: number, y: number) => RealVectors[4];
  };
  3: {
    1: (x: number, y: number, z: number) => number;
    2: (x: number, y: number, z: number) => RealVectors[2];
    3: (x: number, y: number, z: number) => RealVectors[3];
    4: (x: number, y: number, z: number) => RealVectors[4];
  };
  4: {
    1: (w: number, x: number, y: number, z: number) => number;
    2: (w: number, x: number, y: number, z: number) => RealVectors[2];
    3: (w: number, x: number, y: number, z: number) => RealVectors[3];
    4: (w: number, x: number, y: number, z: number) => RealVectors[4];
  };
  5: {
    1: (w: number, x: number, y: number, z: number) => number;
    2: (w: number, x: number, y: number, z: number) => RealVectors[2];
    3: (w: number, x: number, y: number, z: number) => RealVectors[3];
    4: (w: number, x: number, y: number, z: number) => RealVectors[4];
  };
};

type RealDomainFuncs = {
  1: {
    1: (x: number) => MaybeComplex;
    2: (x: number) => MaybeComplexVectors[2];
    3: (x: number) => MaybeComplexVectors[3];
    4: (x: number) => MaybeComplexVectors[4];
  };
  2: {
    1: (x: number, y: number) => MaybeComplex;
    2: (x: number, y: number) => MaybeComplexVectors[2];
    3: (x: number, y: number) => MaybeComplexVectors[3];
    4: (x: number, y: number) => MaybeComplexVectors[4];
  };
  3: {
    1: (x: number, y: number, z: number) => MaybeComplex;
    2: (x: number, y: number, z: number) => MaybeComplexVectors[2];
    3: (x: number, y: number, z: number) => MaybeComplexVectors[3];
    4: (x: number, y: number, z: number) => MaybeComplexVectors[4];
  };
  4: {
    1: (w: number, x: number, y: number, z: number) => MaybeComplex;
    2: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[2];
    3: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[3];
    4: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[4];
  };
  5: {
    1: (w: number, x: number, y: number, z: number) => MaybeComplex;
    2: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[2];
    3: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[3];
    4: (w: number, x: number, y: number, z: number) => MaybeComplexVectors[4];
  };
};

const realFunc = <M extends Dim | 5, N extends Dim>(fromDim: M, toDim: N) => {
  const message = (detail: string) =>
    `Expected a function from R^${fromDim} -> R^${toDim}. ${detail}`;
  const schema = yup
    .mixed<RealFuncs[M][N]>()
    .required()
    .test({
      name: `func-arity-${fromDim}`,
      message: message(`This is not a function from R^${fromDim}.`),
      test: (f) => {
        return f?.length === fromDim;
      },
    })
    .test({
      name: `func-to-R${toDim}`,
      message: message(`The outputs of this function are not in R^${toDim}`),
      test: (f) => {
        const sample = Array(fromDim)
          .fill(0)
          .map(() => Math.random());
        // @ts-expect-error TS can't tell that sample has correct number of params
        const out = f?.(...sample);
        if (toDim === 1) {
          return real.isValidSync(out);
        }
        return realVectors[toDim].isValidSync(out);
      },
    });
  return schema;
};

const realFuncSchemas = {
  1: {
    1: realFunc(1, 1),
    2: realFunc(1, 2),
    3: realFunc(1, 3),
    4: realFunc(1, 4),
  },
  2: {
    1: realFunc(2, 1),
    2: realFunc(2, 2),
    3: realFunc(2, 3),
    4: realFunc(2, 4),
  },
  3: {
    1: realFunc(3, 1),
    2: realFunc(3, 2),
    3: realFunc(3, 3),
    4: realFunc(3, 4),
  },
  4: {
    1: realFunc(4, 1),
    2: realFunc(4, 2),
    3: realFunc(4, 3),
    4: realFunc(4, 4),
  },
  5: {
    1: realFunc(5, 1),
  },
};

const realDomainFunc = <M extends Dim | 5, N extends Dim>(
  fromDim: M,
  toDim: N,
) => {
  const message = (detail: string) =>
    `Expected a function from R^${fromDim} -> R^${toDim} (or C^${toDim}). ${detail}`;
  const schema = yup
    .mixed<RealDomainFuncs[M][N]>()
    .required()
    .test({
      name: "Input dimension",
      message: message(`This is not a function from R^${fromDim}.`),
      test: (f) => {
        return f?.length === fromDim;
      },
    })
    .test({
      name: "output dimension",
      test: (f, ctx) => {
        const sample = Array(fromDim)
          .fill(0)
          .map(() => Math.random());
        /**
         * ASSUMPTION: outputs of f are always have same length and are always
         * or (never) numbers.
         *
         * A terrible assumption for software functions, but good for math
         * functions.
         */
        // @ts-expect-error TS can't tell that sample has correct number of params
        const out = f?.(...sample);
        if (toDim === 1) {
          return maybeComplex.isValidSync(out)
            ? true
            : ctx.createError({
                message: message("Outputs are not real (or complex)."),
              });
        }
        if (Array.isArray(out) && out.length !== toDim) {
          return ctx.createError({
            message: message(
              `Output has wrong number of components (${out.length})`,
            ),
          });
        }
        maybeComplexVectors[toDim].validateSync(out);
        return true;
      },
    });
  return schema;
};

const realDomainFuncSchemas = {
  1: {
    1: realDomainFunc(1, 1),
    2: realDomainFunc(1, 2),
    3: realDomainFunc(1, 3),
    4: realDomainFunc(1, 4),
  },
  2: {
    1: realDomainFunc(2, 1),
    2: realDomainFunc(2, 2),
    3: realDomainFunc(2, 3),
    4: realDomainFunc(2, 4),
  },
  3: {
    1: realDomainFunc(3, 1),
    2: realDomainFunc(3, 2),
    3: realDomainFunc(3, 3),
    4: realDomainFunc(3, 4),
  },
  4: {
    1: realDomainFunc(4, 1),
    2: realDomainFunc(4, 2),
    3: realDomainFunc(4, 3),
    4: realDomainFunc(4, 4),
  },
  5: {
    1: realDomainFunc(5, 1),
  },
};

const realFuncValidators = {
  1: {
    1: firstArg(realFuncSchemas[1][1].validateSync.bind(realFuncSchemas[1][1])),
    2: firstArg(realFuncSchemas[1][2].validateSync.bind(realFuncSchemas[1][2])),
    3: firstArg(realFuncSchemas[1][3].validateSync.bind(realFuncSchemas[1][3])),
    4: firstArg(realFuncSchemas[1][4].validateSync.bind(realFuncSchemas[1][4])),
  },
  2: {
    1: firstArg(realFuncSchemas[2][1].validateSync.bind(realFuncSchemas[2][1])),
    2: firstArg(realFuncSchemas[2][2].validateSync.bind(realFuncSchemas[2][2])),
    3: firstArg(realFuncSchemas[2][3].validateSync.bind(realFuncSchemas[2][3])),
    4: firstArg(realFuncSchemas[2][4].validateSync.bind(realFuncSchemas[2][4])),
  },
  3: {
    1: firstArg(realFuncSchemas[3][1].validateSync.bind(realFuncSchemas[3][1])),
    2: firstArg(realFuncSchemas[3][2].validateSync.bind(realFuncSchemas[3][2])),
    3: firstArg(realFuncSchemas[3][3].validateSync.bind(realFuncSchemas[3][3])),
    4: firstArg(realFuncSchemas[3][4].validateSync.bind(realFuncSchemas[3][4])),
  },
  4: {
    1: firstArg(realFuncSchemas[4][1].validateSync.bind(realFuncSchemas[4][1])),
    2: firstArg(realFuncSchemas[4][2].validateSync.bind(realFuncSchemas[4][2])),
    3: firstArg(realFuncSchemas[4][3].validateSync.bind(realFuncSchemas[4][3])),
    4: firstArg(realFuncSchemas[4][4].validateSync.bind(realFuncSchemas[4][4])),
  },
  5: {
    1: firstArg(realFuncSchemas[5][1].validateSync.bind(realFuncSchemas[5][1])),
  },
};

const rdfs = realDomainFuncSchemas;
const realDomainFuncValidators = {
  1: {
    1: firstArg(rdfs[1][1].validateSync.bind(rdfs[1][1])),
    2: firstArg(rdfs[1][2].validateSync.bind(rdfs[1][2])),
    3: firstArg(rdfs[1][3].validateSync.bind(rdfs[1][3])),
    4: firstArg(rdfs[1][4].validateSync.bind(rdfs[1][4])),
  },
  2: {
    1: firstArg(rdfs[2][1].validateSync.bind(rdfs[2][1])),
    2: firstArg(rdfs[2][2].validateSync.bind(rdfs[2][2])),
    3: firstArg(rdfs[2][3].validateSync.bind(rdfs[2][3])),
    4: firstArg(rdfs[2][4].validateSync.bind(rdfs[2][4])),
  },
  3: {
    1: firstArg(rdfs[3][1].validateSync.bind(rdfs[3][1])),
    2: firstArg(rdfs[3][2].validateSync.bind(rdfs[3][2])),
    3: firstArg(rdfs[3][3].validateSync.bind(rdfs[3][3])),
    4: firstArg(rdfs[3][4].validateSync.bind(rdfs[3][4])),
  },
  4: {
    1: firstArg(rdfs[4][1].validateSync.bind(rdfs[4][1])),
    2: firstArg(rdfs[4][2].validateSync.bind(rdfs[4][2])),
    3: firstArg(rdfs[4][3].validateSync.bind(rdfs[4][3])),
    4: firstArg(rdfs[4][4].validateSync.bind(rdfs[4][4])),
  },
  5: {
    1: firstArg(rdfs[5][1].validateSync.bind(rdfs[5][1])),
  },
};

const realVecValidators = {
  1: firstArg(realVectors[1].validateSync.bind(realVectors[1])),
  2: firstArg(realVectors[2].validateSync.bind(realVectors[2])),
  3: firstArg(realVectors[3].validateSync.bind(realVectors[3])),
  4: firstArg(realVectors[4].validateSync.bind(realVectors[4])),
};

function arrayOf<T, N extends number>(
  itemValidator: Validator<T>,
  n: N,
): Validator<TupleOf<T, N>>;
function arrayOf<T>(itemValidator: Validator<T>): Validator<T[]>;
function arrayOf<T, N extends number>(itemValidator: Validator<T>, n?: N) {
  return (value: unknown) => {
    if (!Array.isArray(value)) {
      throw new Error(`Expected an array, received a ${typeof value}`);
    }
    if (n !== undefined && value.length !== n) {
      throw new Error(
        `Expected an array of length ${n}, received ${value.length}`,
      );
    }
    return aggregate(value, itemValidator);
  };
}

const oneOrMany: <T>(itemValidator: Validator<T>) => Validator<T[]> =
  (itemValidator) => (value) => {
    try {
      return [itemValidator(value)];
    } catch (err) {
      try {
        return arrayOf(itemValidator)(value);
      } catch (batchError) {
        /** pass */
      }
      throw err;
    }
  };

export const validators = {
  real: firstArg(real.validateSync.bind(real)),
  nonnegative: firstArg(positive.validateSync.bind(nonnegative)),
  positive: firstArg(positive.validateSync.bind(positive)),
  array: firstArg(array.validateSync.bind(array)),
  realFunc: realFuncValidators,
  realDomainFunc: realDomainFuncValidators,
  realVec: realVecValidators,
  boolean,
  arrayOf,
  oneOrMany,
};

export type { MaybeComplex };
