import { validators, domainFuncs } from "@math3d/validators";
import { WidgetType } from "./constants";
import type { PropertyConfig } from "./interfaces";

const color: PropertyConfig<"color"> = {
  name: "color",
  label: "Color",
  widget: WidgetType.Color,
};

const description: PropertyConfig<"description"> = {
  name: "description",
  label: "Description",
  widget: WidgetType.AutosizeText,
};

const gridOpacity: PropertyConfig<"gridOpacity", number> = {
  name: "gridOpacity",
  label: "Grid Opacity",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const grid1: PropertyConfig<"grid1", number> = {
  name: "grid1",
  label: "Grid (1st parameter)",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const grid2: PropertyConfig<"grid2", number> = {
  name: "grid2",
  label: "Grid (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const gridWidth: PropertyConfig<"gridWidth", number> = {
  name: "gridWidth",
  label: "Grid Width",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const label: PropertyConfig<"label"> = {
  name: "label",
  label: "Label",
  widget: WidgetType.Text,
};

const labelVisible: PropertyConfig<"labelVisible", boolean> = {
  name: "labelVisible",
  label: "Label Visible",
  widget: WidgetType.MathBoolean,
  validate: validators.boolean,
};

const opacity: PropertyConfig<"opacity", number> = {
  name: "opacity",
  label: "Opacity",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const range1: PropertyConfig<"range1", [number, number]> = {
  name: "range1",
  label: "Range (1st parameter)",
  widget: WidgetType.MathValue,
  validate: validators.realVec[2],
};

type EvaluatedDomain1 = [[number, number]];

const domain1: PropertyConfig<"domain", EvaluatedDomain1> = {
  name: "domain",
  label: "Domain",
  widget: WidgetType.MathValue,
  validate: validators.arrayOf(validators.realVec[2], 1),
};

/**
 * A pair of functions describing a simple subset of R2.
 *
 * For example:
 * ```
 * // For a function f(x, y)
 * // x \in {0, 5}, y \in {0, x}
 * {
 *   value: [(y) => [0, 5], (x) => [0, x]],
 *   order: [0, 1]
 * }
 * ```
 * Here, the `order` property indicates a valid evaluation order for the variables'
 * domains. In this case, the `y` domain depends on the value of `x`, so the
 * evaluation order is "x first, then y".
 *
 * If the function were `f(y, x)`, then the evaluation order would be reversed.
 *
 */
type EvaluatedDomain2 = {
  value: [
    (param: number) => [number, number],
    (param: number) => [number, number],
  ];
  /**
   *
   */
  order: [number, number];
};

const domain2: PropertyConfig<"domain", EvaluatedDomain2> = {
  name: "domain",
  label: "Domain",
  widget: WidgetType.CustomMath,
  validate: (value, node) => {
    const funcs = validators.arrayOf(validators.realFunc[1][2], 2)(value);
    const order = domainFuncs[2](node);
    return {
      value: funcs,
      order,
    };
  },
};

type EvaluatedDomain3 = [[number, number], [number, number], [number, number]];

const domain3: PropertyConfig<"domain", EvaluatedDomain3> = {
  name: "domain",
  label: "Domain",
  widget: WidgetType.CustomMath,
  validate: validators.arrayOf(validators.realVec[2], 3),
};

const range2: PropertyConfig<"range2", [number, number]> = {
  name: "range2",
  label: "Range (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: validators.realVec[2],
};

const range3: PropertyConfig<"range3", [number, number]> = {
  name: "range3",
  label: "Range (3rd parameter)",
  widget: WidgetType.MathValue,
  validate: validators.realVec[2],
};

const shaded: PropertyConfig<"shaded", boolean> = {
  name: "shaded",
  label: "Shaded",
  widget: WidgetType.MathBoolean,
  validate: validators.boolean,
};

const size: PropertyConfig<"size", number> = {
  name: "size",
  label: "Size",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const samples1: PropertyConfig<"samples1", number> = {
  name: "samples1",
  label: "Samples (1st parameter)",
  widget: WidgetType.MathValue,
  validate: validators.positive,
};

const samples2: PropertyConfig<"samples2", number> = {
  name: "samples2",
  label: "Samples (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: validators.positive,
};

const samples3: PropertyConfig<"samples3", number> = {
  name: "samples3",
  label: "Samples (3rd parameter)",
  widget: WidgetType.MathValue,
  validate: validators.positive,
};

const visible: PropertyConfig<"visible"> = {
  name: "visible",
  label: "Visible",
  widget: WidgetType.Custom,
};
const calculatedVisibility: PropertyConfig<"calculatedVisibility", boolean> = {
  name: "calculatedVisibility",
  label: "Calculated Visibility",
  widget: WidgetType.MathValue,
  validate: validators.boolean,
};
const useCalculatedVisibility: PropertyConfig<"useCalculatedVisibility"> = {
  name: "useCalculatedVisibility",
  label: "Use Calculated Visibility",
  widget: WidgetType.Custom,
};
const visibilityProps = {
  visible,
  calculatedVisibility,
  useCalculatedVisibility,
};

const width: PropertyConfig<"width", number> = {
  name: "width",
  label: "Width",
  widget: WidgetType.MathValue,
  validate: validators.nonnegative,
};

const zBias: PropertyConfig<"zBias", number> = {
  name: "zBias",
  label: "Z-Bias",
  widget: WidgetType.MathValue,
  validate: validators.real,
  description:
    "Offset the object toward (positive) or away (negative) from the camera.",
};

const zIndex: PropertyConfig<"zIndex", number> = {
  name: "zIndex",
  label: "Z-Index",
  widget: WidgetType.MathValue,
  validate: validators.real,
};

const zOrder: PropertyConfig<"zOrder", number | undefined> = {
  name: "zOrder",
  label: "Z-Order",
  widget: WidgetType.MathValue,
  validate: (v) => {
    if (v === undefined) return undefined;
    return validators.real(v);
  },
  description: `Browser limitations mean transparency won't always look correct
from all directions, particulary for surfaces. You will be able to see objects
drawn first through objects drawn last. Higher values are drawn last. By default,
surfaces are drawn last; ties are broken by the order of appearence in folders.`,
};

const start: PropertyConfig<"start", boolean> = {
  name: "start",
  label: "Arrow (start)",
  widget: WidgetType.MathBoolean,
  validate: validators.boolean,
};
const end: PropertyConfig<"end", boolean> = {
  name: "end",
  label: "Arrow (end)",
  widget: WidgetType.MathBoolean,
  validate: validators.boolean,
};

export {
  color,
  description,
  end,
  gridOpacity,
  grid1,
  grid2,
  gridWidth,
  label,
  labelVisible,
  opacity,
  range1,
  range2,
  range3,
  samples1,
  samples2,
  samples3,
  shaded,
  size,
  start,
  visible,
  calculatedVisibility,
  useCalculatedVisibility,
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
  domain1,
  domain2,
  domain3,
};

export type { EvaluatedDomain1, EvaluatedDomain2, EvaluatedDomain3 };
