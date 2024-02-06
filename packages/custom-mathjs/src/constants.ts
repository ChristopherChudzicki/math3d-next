import { factory } from "mathjs";

declare module "mathjs" {
  export interface MathJsStatic {
    // @ts-expect-error can't change the type of mathjs I
    i: [number, number, number];
    j: [number, number, number];
    k: [number, number, number];
    uniti: [number, number, number];
    unitj: [number, number, number];
    unitk: [number, number, number];
    unitx: [number, number, number];
    unity: [number, number, number];
    unitz: [number, number, number];
    I: Complex;
  }
}

const constants = {
  i: factory("i", [], () => {
    return [1, 0, 0];
  }),
  j: factory("j", [], () => {
    return [0, 1, 0];
  }),
  k: factory("k", [], () => {
    return [0, 0, 1];
  }),
  uniti: factory("uniti", [], () => {
    return [1, 0, 0];
  }),
  unitj: factory("unitj", [], () => {
    return [0, 1, 0];
  }),
  unitk: factory("unitk", [], () => {
    return [0, 0, 1];
  }),
  unitx: factory("unitx", [], () => {
    return [1, 0, 0];
  }),
  unity: factory("unity", [], () => {
    return [0, 1, 0];
  }),
  unitz: factory("unitz", [], () => {
    return [0, 0, 1];
  }),
  I: factory("I", ["complex"], ({ complex }) => {
    return complex(0, 1);
  }),
  imaginaryI: factory("imaginaryI", ["complex"], ({ complex }) => {
    return complex(0, 1);
  }),
};

export default constants;
