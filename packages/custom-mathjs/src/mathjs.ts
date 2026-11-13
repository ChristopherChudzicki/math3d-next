import {
  create,
  // normal trig
  sinDependencies,
  cosDependencies,
  tanDependencies,
  asinDependencies,
  acosDependencies,
  atanDependencies,
  secDependencies,
  cscDependencies,
  cotDependencies,
  asecDependencies,
  acscDependencies,
  acotDependencies,
  // hyperbolic trig
  sinhDependencies,
  coshDependencies,
  tanhDependencies,
  asinhDependencies,
  acoshDependencies,
  atanhDependencies,
  sechDependencies,
  cschDependencies,
  cothDependencies,
  asechDependencies,
  acschDependencies,
  acothDependencies,
  // exponential
  logDependencies,
  log10Dependencies,
  log2Dependencies,
  expDependencies,
  // algebraic
  squareDependencies,
  sqrtDependencies,
  cubeDependencies,
  cbrtDependencies,
  nthRootDependencies,
  // misc functions
  absDependencies,
  signDependencies,
  floorDependencies,
  ceilDependencies,
  modDependencies,
  argDependencies,
  lcmDependencies,
  // statistics
  minDependencies,
  maxDependencies,
  sumDependencies,
  meanDependencies,
  // operators
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
  orDependencies,
  andDependencies,
  notDependencies,
  // constants
  piDependencies,
  eDependencies,
  iDependencies,
  InfinityDependencies,
  tauDependencies,
  // parsing
  evaluateDependencies,
  simplifyDependencies,
  // objects
  matrixDependencies,
  complexDependencies,
  // vector functions
  crossDependencies,
  normDependencies,
  dotDependencies,
  dotMultiplyDependencies,
  traceDependencies,
  atan2Dependencies,
  // vectors
  indexDependencies,
  mapDependencies,
  onesDependencies,
  indexTransformDependencies,
  rangeTransformDependencies,
  subsetTransformDependencies,
  mapTransformDependencies,
  columnTransformDependencies,
  concatTransformDependencies,
  minTransformDependencies,
  maxTransformDependencies,
  sumTransformDependencies,
  meanTransformDependencies,
} from "mathjs";
import type { Complex, MathType } from "mathjs";

import {
  createCurl,
  createDivergence,
  createTotalDerivative,
  createUnitB,
  createUnitN,
  createUnitT,
} from "./derivatives";

import customConstants from "./constants";
import { realRootSign } from "./realRootSign";

const normalTrig = {
  sinDependencies,
  cosDependencies,
  tanDependencies,
  asinDependencies,
  acosDependencies,
  atanDependencies,
  atan2Dependencies,
  secDependencies,
  cscDependencies,
  cotDependencies,
  asecDependencies,
  acscDependencies,
  acotDependencies,
};

const hyperbolicTrig = {
  sinhDependencies,
  coshDependencies,
  tanhDependencies,
  asinhDependencies,
  acoshDependencies,
  atanhDependencies,
  sechDependencies,
  cschDependencies,
  cothDependencies,
  asechDependencies,
  acschDependencies,
  acothDependencies,
};

const exponential = {
  logDependencies,
  log10Dependencies,
  log2Dependencies,
  expDependencies,
};

const algebraic = {
  squareDependencies,
  sqrtDependencies,
  cubeDependencies,
  cbrtDependencies,
  nthRootDependencies,
};

const miscFuncs = {
  absDependencies,
  signDependencies,
  floorDependencies,
  ceilDependencies,
  modDependencies,
  argDependencies,
  lcmDependencies,
};

const statistics = {
  minDependencies,
  maxDependencies,
  sumDependencies,
  meanDependencies,
};

const operators = {
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
  orDependencies,
  andDependencies,
  notDependencies,
};

const constants = {
  piDependencies,
  eDependencies,
  iDependencies,
  InfinityDependencies,
  tauDependencies,
};

const vectorFunctions = {
  crossDependencies,
  normDependencies,
  dotDependencies,
  dotMultiplyDependencies,
  traceDependencies,
};

const mathjs = create({
  normalTrig,
  hyperbolicTrig,
  exponential,
  algebraic,
  miscFuncs,
  statistics,
  operators,
  constants,
  evaluateDependencies,
  matrixDependencies,
  complexDependencies,
  vectorFunctions,
  simplifyDependencies,
  // vectors, matrices
  indexDependencies,
  mapDependencies,
  onesDependencies,
  // Expressions count from 1, as in full mathjs: a[1], a[end], index(1),
  // subset's out-of-range errors, map's callback index, and the dimension
  // arguments of column, concat, min, max, sum and mean. Ranges include
  // their end (1:3 is [1, 2, 3]). The JS API stays 0-based.
  // Keep these after the plain factories: expressions use whichever of f and
  // f.transform is imported last.
  indexTransformDependencies,
  rangeTransformDependencies,
  subsetTransformDependencies,
  mapTransformDependencies,
  // Other factories bring in column and concat as dependencies.
  columnTransformDependencies,
  concatTransformDependencies,
  minTransformDependencies,
  maxTransformDependencies,
  sumTransformDependencies,
  meanTransformDependencies,
});

mathjs.import({
  ln: mathjs.log,
  diff: createTotalDerivative,
  unitT: createUnitT,
  unitN: createUnitN,
  unitB: createUnitB,
  curl: createCurl,
  div: createDivergence,
});

/** mathjs's own pow. */
const principalPow = mathjs.pow;
const { nthRoot } = mathjs;

mathjs.import(
  {
    // A negative number to an odd-denominator fraction takes its real root:
    // (-8)^(1/3) is -2, where principalPow gives 1 + 1.73i.
    pow: mathjs.typed("pow", {
      "number, number": (x: number, y: number) => {
        // Same as principalPow here, without its typed dispatch.
        if (x >= 0 || Number.isInteger(y)) return x ** y;
        // A NaN base is left to principalPow.
        const sign = x < 0 ? realRootSign(y) : 0;
        return sign === 0 ? principalPow(x, y) : sign * (-x) ** y;
      },
      "any, any": (x: MathType, y: number | Complex) => principalPow(x, y),
    }),
    // nthRoot, except that a negative number with no real root gives NaN,
    // which a graph leaves out, where nthRoot throws and blanks the graph.
    root: mathjs.typed("root", {
      number: (x: number) => (x < 0 ? NaN : nthRoot(x)),
      "number, number": (x: number, n: number) =>
        x < 0 && Math.abs(n % 2) !== 1 ? NaN : nthRoot(x, n),
      any: nthRoot,
      "any, any": nthRoot,
    }),
  },
  { override: true },
);

mathjs.import(
  {
    customConstants,
    arccos: mathjs.acos,
    arcsin: mathjs.asin,
    // arctan(y, x) generalizes arctan(y / x), as atan2(y, x) does.
    arctan: (y: number, x?: number) => {
      if (x === undefined) {
        return mathjs.atan(y);
      }
      return mathjs.atan2(y, x);
    },
    arcsec: mathjs.asec,
    arccsc: mathjs.acsc,
    arccot: mathjs.acot,
    arccosh: mathjs.acosh,
    arcsinh: mathjs.asinh,
    arctanh: mathjs.atanh,
    arcsech: mathjs.asech,
    arccsch: mathjs.acsch,
    arccoth: mathjs.acoth,
    grad: mathjs.diff,
  },
  { override: true },
);

export default mathjs;
export { principalPow };
