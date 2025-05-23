import { validators } from "@math3d/validators";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  end,
  label,
  labelVisible,
  opacity,
  size,
  start,
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
} from "../shared";

interface AxisProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;

  label: string;
  labelVisible: string;
  min: string;
  max: string;
  axis: "x" | "y" | "z";
  scale: string;
  ticksVisible: string;
  size: string;
  width: string;
  start: string;
  end: string;
  divisions: string;
}

const defaultValues: AxisProperties = {
  description: "Axis",
  color: "#808080",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  label: "x",
  labelVisible: "true",
  min: "-5",
  max: "+5",
  axis: "x",
  scale: "1",
  ticksVisible: "true",
  size: "6",
  width: "1",
  end: "true",
  start: "false",
  divisions: "10",
};

const make: MathItemGenerator<MathItemType.Axis, AxisProperties> = (id) => ({
  id,
  type: MathItemType.Axis,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  labelVisible: boolean;
  ticksVisible: boolean;
  opacity: number;
  size: number;
  calculatedVisibility: boolean;
  width: number;
  zBias: number;
  zIndex: number;
  zOrder: number | undefined;
  min: number;
  max: number;
  scale: number;
  start: boolean;
  end: boolean;
  divisions: number;
};

const config: IMathItemConfig<
  MathItemType.Axis,
  AxisProperties,
  EvaluatedProperties
> = {
  type: MathItemType.Axis,
  label: "Axis",
  properties: {
    axis: {
      name: "axis",
      label: "Axis",
      widget: WidgetType.Text,
    },
    color,
    description,
    label,
    labelVisible,
    min: {
      name: "min",
      label: "Min",
      widget: WidgetType.MathValue,
      validate: validators.real,
    },
    max: {
      name: "max",
      label: "Max",
      widget: WidgetType.MathValue,
      validate: validators.real,
    },
    opacity,
    scale: {
      name: "scale",
      label: "Scale",
      widget: WidgetType.MathValue,
      validate: validators.real,
    },
    size,
    ticksVisible: {
      name: "ticksVisible",
      label: "Ticks Visible",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    ...visibilityProps,
    width,
    zBias,
    zIndex,
    zOrder,
    start,
    end,
    divisions: {
      name: "divisions",
      label: "Divisions",
      widget: WidgetType.MathValue,
      validate: validators.nonnegative,
    },
  },
  settingsProperties: [
    "calculatedVisibility",
    "label",
    "labelVisible",
    "ticksVisible",
    "opacity",
    "size",
    "width",
    "scale",
    "zBias",
    "zOrder",
    "start",
    "end",
    "divisions",
  ],
  make,
};

type Axis = IMathItem<MathItemType.Axis, AxisProperties>;

export type { Axis, AxisProperties, EvaluatedProperties };
export { config };
