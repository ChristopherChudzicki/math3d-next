import * as yup from "yup";
import type { TupleOf } from "@/types";
import aggregate from "../aggregate";
import type { Validator } from "./interfaces";

const firstArg = <A, B, C>(f: (a: A, b?: B) => C) => {
  return (x: A) => f(x);
};

const num = yup.number().strict().required();
const array = yup.array().strict().required();

type Dim = 1 | 2 | 3 | 4;

type RealVectors = {
  1: [number];
  2: [number, number];
  3: [number, number, number];
  4: [number, number, number, number];
};

export const real = num;

const positive = real.positive();

const realVectors = {
  1: yup.tuple([num]).strict().required(),
  2: yup.tuple([num, num]).strict().required(),
  3: yup.tuple([num, num, num]).strict().required(),
  4: yup.tuple([num, num, num, num]).strict().required(),
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
};

const numericFunc = <M extends Dim, N extends Dim>(fromDim: M, toDim: N) => {
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
        return realVectors[toDim].isValidSync(out);
      },
    });
  return schema;
};

const realFuncSchemas = {
  1: {
    1: numericFunc(1, 1),
    2: numericFunc(1, 2),
    3: numericFunc(1, 3),
    4: numericFunc(1, 4),
  },
  2: {
    1: numericFunc(2, 1),
    2: numericFunc(2, 2),
    3: numericFunc(2, 3),
    4: numericFunc(2, 4),
  },
  3: {
    1: numericFunc(2, 1),
    2: numericFunc(3, 2),
    3: numericFunc(3, 3),
    4: numericFunc(3, 4),
  },
  4: {
    1: numericFunc(2, 1),
    2: numericFunc(3, 2),
    3: numericFunc(3, 3),
    4: numericFunc(3, 4),
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
};

const realVecValidators = {
  1: firstArg(realVectors[1].validateSync.bind(realVectors[1])),
  2: firstArg(realVectors[2].validateSync.bind(realVectors[2])),
  3: firstArg(realVectors[3].validateSync.bind(realVectors[3])),
  4: firstArg(realVectors[4].validateSync.bind(realVectors[4])),
};

const boolean = yup.boolean().strict().required();

function arrayOf<T, N extends number>(
  itemValidator: Validator<T>,
  n: N
): Validator<TupleOf<T, N>>;
function arrayOf<T>(itemValidator: Validator<T>): Validator<T[]>;
function arrayOf<T, N extends number>(itemValidator: Validator<T>, n?: N) {
  return (value: unknown) => {
    if (!Array.isArray(value)) {
      throw new Error(`Expected an array, received a ${typeof value}`);
    }
    if (n !== undefined && value.length !== n) {
      throw new Error(
        `Expected an array of length ${n}, received ${value.length}`
      );
    }
    return aggregate(value, itemValidator);
  };
}

export const validators = {
  real: firstArg(real.validateSync.bind(real)),
  positive: firstArg(positive.validateSync.bind(positive)),
  array: firstArg(array.validateSync.bind(array)),
  realFunc: realFuncValidators,
  realVec: realVecValidators,
  boolean: firstArg(boolean.validateSync.bind(boolean)),
  arrayOf,
};
