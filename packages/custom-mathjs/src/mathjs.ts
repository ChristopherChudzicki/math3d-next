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
  atan2Dependencies,
  // vectors
  indexDependencies,
  mapDependencies,
} from "mathjs";

import {
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
};

const mathjs = create({
  normalTrig,
  hyperbolicTrig,
  exponential,
  algebraic,
  miscFuncs,
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
});

mathjs.import({
  ln: mathjs.log,
  diff: createTotalDerivative,
  unitT: createUnitT,
  unitN: createUnitN,
  unitB: createUnitB,
});

mathjs.import(
  {
    customConstants,
    root: mathjs.nthRoot,
    arccos: mathjs.acos,
    arcsin: mathjs.asin,
    arctan: (x: number, y: number) => {
      if (y === undefined) {
        return mathjs.atan(x);
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
    // @ts-expect-error diff is defined above
    grad: mathjs.diff,
  },
  { override: true },
);

export default mathjs;
