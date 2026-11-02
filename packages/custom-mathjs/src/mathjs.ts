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
} from "mathjs";

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
