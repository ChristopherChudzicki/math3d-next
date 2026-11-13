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

type NumberPow = (x: number, y: number) => unknown;
const principalPow = (
  mathjs.typed as unknown as { find(f: unknown, signature: string): NumberPow }
).find(mathjs.pow, "number, number");

/** pow, except that a negative number to a number gives sign * |x|^y. */
const realPow = (name: string, sign: 1 | -1) =>
  mathjs.typed(name, {
    "number, number": (x: number, y: number) =>
      x < 0 ? sign * (-x) ** y : principalPow(x, y),
    "any, any": (x: MathType, y: number | Complex) => mathjs.pow(x, y),
  });

mathjs.import({
  // What the parser's realRootRule makes of x^(p/q) with q odd, by whether p
  // is odd or even. A negative number takes its real root, (-1)^p |x|^(p/q):
  // (-8)^(1/3) is -2, not pow's principal root 1 + 1.73i.
  $realPowOdd: realPow("$realPowOdd", -1),
  $realPowEven: realPow("$realPowEven", 1),
});

mathjs.import(
  {
    customConstants,
    root: mathjs.nthRoot,
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
