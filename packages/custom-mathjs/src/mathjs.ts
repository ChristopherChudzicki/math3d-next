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
  // misc
  absDependencies,
  signDependencies,
  floorDependencies,
  ceilDependencies,
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
  evalDependencies,
  // objects
  matrixDependencies,
  complexDependencies,
} from "mathjs";

const normalTrig = {
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
};

const miscFuncs = {
  absDependencies,
  signDependencies,
  floorDependencies,
  ceilDependencies,
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

const mathjs = create({
  normalTrig,
  hyperbolicTrig,
  exponential,
  algebraic,
  miscFuncs,
  operators,
  constants,
  evalDependencies,
  matrixDependencies,
  complexDependencies,
});

export default mathjs;
