import { validators } from "@/util/validators";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  label,
  labelVisible,
  opacity,
  size,
  visible,
  width,
  zBias,
  zIndex,
} from "../shared";

interface AxisProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  min: string;
  max: string;
  axis: "x" | "y" | "z";
  scale: string;
  ticksVisible: string;
  size: string;
  width: string;
}

const defaultValues: AxisProperties = {
  description: "Axis",
  color: "#808080",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "x",
  labelVisible: "true",
  min: "-5",
  max: "+5",
  axis: "x",
  scale: "1",
  ticksVisible: "true",
  size: "2",
  width: "1",
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
  visible: boolean;
  width: number;
  zBias: number;
  zIndex: number;
  min: number;
  max: number;
  scale: number;
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
    visible,
    width,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "label",
    "labelVisible",
    "opacity",
    "size",
    "width",
    "scale",
    "zBias",
    "zIndex",
  ],
  make,
};

type Axis = IMathItem<MathItemType.Axis, AxisProperties>;

export type { Axis, AxisProperties, EvaluatedProperties };
export { config };
