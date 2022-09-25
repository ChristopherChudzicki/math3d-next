import * as yup from "yup";

const num = yup.number().strict().required();

type Dim = 1 | 2 | 3 | 4;

type RealVectors = {
  1: [number];
  2: [number, number];
  3: [number, number, number];
  4: [number, number, number, number];
};

export const real = num;

export const realVectors = {
  1: yup.tuple([num]),
  2: yup.tuple([num, num]),
  3: yup.tuple([num, num, num]),
  4: yup.tuple([num, num, num, num]),
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
    .transform((f) => {
      const zeros = Array(fromDim).fill(0);
      return f(zeros);
    })
    .test({
      name: `func-arity-${fromDim}`,
      message: message(`This is not a function from R^${fromDim}.`),
      test: (_x, ctx) => {
        return ctx.originalValue.length === fromDim;
      },
    })
    .test({
      name: `func-to-R${toDim}`,
      message: message(`The outputs of this function are not in R^${toDim}`),
      test: (x) => {
        return realVectors[toDim].isValidSync(x);
      },
    });
  return schema;
};

export const realFuncSchemas = {
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

export const validators = {
  real: real.validateSync.bind(real),
};
