import { validators } from "@/util";
import { schema } from "@/util/validators";
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
  validate: schema.positive.validateSync,
};

const grid1: PropertyConfig<"grid1", number> = {
  name: "grid1",
  label: "Grid (1st parameter)",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const grid2: PropertyConfig<"grid2", number> = {
  name: "grid2",
  label: "Grid (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const gridWidth: PropertyConfig<"gridWidth", number> = {
  name: "gridWidth",
  label: "Grid Width",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
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
  validate: schema.boolean.validateSync,
};

const opacity: PropertyConfig<"opacity", number> = {
  name: "opacity",
  label: "Opacity",
  widget: WidgetType.MathValue,
  validate: validators.positive,
};

const range1: PropertyConfig<"range1", [number, number]> = {
  name: "range1",
  label: "Range (1st parameter)",
  widget: WidgetType.MathValue,
  validate: schema.realVectors[2].validateSync,
};

const range2: PropertyConfig<"range2", [number, number]> = {
  name: "range2",
  label: "Range (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: schema.realVectors[2].validateSync,
};

const range3: PropertyConfig<"range3", [number, number]> = {
  name: "range3",
  label: "Range (3rd parameter)",
  widget: WidgetType.MathValue,
  validate: schema.realVectors[2].validateSync,
};

const shaded: PropertyConfig<"shaded", boolean> = {
  name: "shaded",
  label: "Shaded",
  widget: WidgetType.MathBoolean,
  validate: schema.boolean.validateSync,
};

const size: PropertyConfig<"size", number> = {
  name: "size",
  label: "Size",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const samples1: PropertyConfig<"samples1", number> = {
  name: "samples1",
  label: "Samples (1st parameter)",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const samples2: PropertyConfig<"samples2", number> = {
  name: "samples2",
  label: "Samples (2nd parameter)",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const samples3: PropertyConfig<"samples3", number> = {
  name: "samples3",
  label: "Samples (3rd parameter)",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const visible: PropertyConfig<"visible", boolean> = {
  name: "visible",
  label: "Visible",
  widget: WidgetType.MathBoolean,
  validate: schema.boolean.validateSync,
};

const width: PropertyConfig<"width", number> = {
  name: "width",
  label: "Width",
  widget: WidgetType.MathValue,
  validate: schema.positive.validateSync,
};

const zBias: PropertyConfig<"zBias", number> = {
  name: "zBias",
  label: "Z-Bias",
  widget: WidgetType.MathValue,
  validate: schema.real.validateSync,
};

const zIndex: PropertyConfig<"zIndex", number> = {
  name: "zIndex",
  label: "Z-Index",
  widget: WidgetType.MathValue,
  validate: schema.real.validateSync,
};

const start: PropertyConfig<"start", boolean> = {
  name: "start",
  label: "Arrow (start)",
  widget: WidgetType.MathBoolean,
  validate: schema.boolean.validateSync,
};
const end: PropertyConfig<"end", boolean> = {
  name: "end",
  label: "Arrow (end)",
  widget: WidgetType.MathBoolean,
  validate: schema.boolean.validateSync,
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
