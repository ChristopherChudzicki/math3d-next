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

const gridOpacity: PropertyConfig<"gridOpacity"> = {
  name: "gridOpacity",
  label: "Grid Opacity",
  widget: WidgetType.MathValue,
  // validate real number
};

const grid1: PropertyConfig<"grid1"> = {
  name: "grid1",
  label: "Grid (1st parameter)",
  widget: WidgetType.MathValue,
  // validate real number
};

const grid2: PropertyConfig<"grid2"> = {
  name: "grid2",
  label: "Grid (2nd parameter)",
  widget: WidgetType.MathValue,
  // validate real number
};

const gridWidth: PropertyConfig<"gridWidth"> = {
  name: "gridWidth",
  label: "Grid Width",
  widget: WidgetType.MathValue,
  // validate real number
};

const label: PropertyConfig<"label"> = {
  name: "label",
  label: "Label",
  widget: WidgetType.Text,
  // validate string
};

const labelVisible: PropertyConfig<"labelVisible"> = {
  name: "labelVisible",
  label: "Label Visible",
  widget: WidgetType.MathBoolean,
  // validate boolean
};

const opacity: PropertyConfig<"opacity"> = {
  name: "opacity",
  label: "Opacity",
  widget: WidgetType.MathValue,
  // validate real number
};

const range1: PropertyConfig<"range1"> = {
  name: "range1",
  label: "Range (1st parameter)",
  widget: WidgetType.MathValue,
  // complicated validation... [real, real] or func of V
};

const range2: PropertyConfig<"range2"> = {
  name: "range2",
  label: "Range (2nd parameter)",
  widget: WidgetType.MathValue,
  // complicated validation... [real, real] or func of U
};

const range3: PropertyConfig<"range3"> = {
  name: "range3",
  label: "Range (3rd parameter)",
  widget: WidgetType.MathValue,
  // complicated validation... [real, real] or func of U
};

const shaded: PropertyConfig<"shaded"> = {
  name: "shaded",
  label: "Shaded",
  widget: WidgetType.MathBoolean,
  // validate real number
};

const size: PropertyConfig<"size"> = {
  name: "size",
  label: "Size",
  widget: WidgetType.MathValue,
  // validate real number
};

const samples1: PropertyConfig<"samples1"> = {
  name: "samples1",
  label: "Samples (1st parameter)",
  widget: WidgetType.MathValue,
  // validate real number
};

const samples2: PropertyConfig<"samples2"> = {
  name: "samples2",
  label: "Samples (2nd parameter)",
  widget: WidgetType.MathValue,
  // validate real number
};

const samples3: PropertyConfig<"samples3"> = {
  name: "samples3",
  label: "Samples (3rd parameter)",
  widget: WidgetType.MathValue,
  // validate real number
};

const visible: PropertyConfig<"visible"> = {
  name: "visible",
  label: "Visible",
  widget: WidgetType.MathBoolean,
  // validate boolean
};

const width: PropertyConfig<"width"> = {
  name: "width",
  label: "Width",
  widget: WidgetType.MathValue,
  // validate real number
};

const zBias: PropertyConfig<"zBias"> = {
  name: "zBias",
  label: "Z-Bias",
  widget: WidgetType.MathValue,
  // validate real number
};

const zIndex: PropertyConfig<"zIndex"> = {
  name: "zIndex",
  label: "Z-Index",
  widget: WidgetType.MathValue,
  // validate real number
};

const start: PropertyConfig<"start"> = {
  name: "start",
  label: "Arrow (start)",
  widget: WidgetType.MathBoolean,
  // validate boolean
};
const end: PropertyConfig<"end"> = {
  name: "end",
  label: "Arrow (end)",
  widget: WidgetType.MathBoolean,
  // validate boolean
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
  width,
  zBias,
  zIndex,
};
