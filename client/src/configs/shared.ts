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

const gridU: PropertyConfig<"gridU"> = {
  name: "gridU",
  label: "Grid U",
  widget: WidgetType.MathValue,
  // validate real number
};

const gridV: PropertyConfig<"gridV"> = {
  name: "gridV",
  label: "Grid V",
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

const rangeU: PropertyConfig<"rangeU"> = {
  name: "rangeU",
  label: "Range U",
  widget: WidgetType.MathValue,
  // complicated validation... [real, real] or func of V
};

const rangeV: PropertyConfig<"rangeV"> = {
  name: "rangeV",
  label: "Range V",
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

const uSamples: PropertyConfig<"uSamples"> = {
  name: "uSamples",
  label: "Samples U",
  widget: WidgetType.MathValue,
  // validate real number
};

const vSamples: PropertyConfig<"vSamples"> = {
  name: "vSamples",
  label: "Samples V",
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
  label: "Z-Index",
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
  gridU,
  gridV,
  gridWidth,
  label,
  labelVisible,
  opacity,
  rangeU,
  rangeV,
  shaded,
  size,
  start,
  uSamples,
  visible,
  vSamples,
  width,
  zBias,
  zIndex,
};
