import { factory } from "mathjs";
import type { MathJsStatic, Complex } from "mathjs";

declare module "mathjs" {
  export interface MathJsStatic {
    // @ts-expect-error can't change the type of mathjs I
    i: [number, number, number];
    j: [number, number, number];
    k: [number, number, number];
    hati: [number, number, number];
    hatj: [number, number, number];
    hatk: [number, number, number];
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
  hati: factory("hati", [], () => {
    return [1, 0, 0];
  }),
  hatj: factory("hatj", [], () => {
    return [0, 1, 0];
  }),
  hatk: factory("hatk", [], () => {
    return [0, 0, 1];
  }),
  I: factory("I", ["complex"], ({ complex }) => {
    return complex(0, 1);
  }),
};

export default constants;
