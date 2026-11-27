import { mixed } from "yup";

export const viewportSearchFields = {
  /**
   * `?oit=0` draws translucent items in MathBox's order, for comparing the two
   * renderers. Without it they blend order-independently where the browser
   * can.
   */
  oit: mixed<0>().oneOf([0]),
  /**
   * `?gloss=0` lights shaded surfaces as MathBox does, for comparison
   * captures; otherwise they are glossy.
   */
  gloss: mixed<0>().oneOf([0]),
};
