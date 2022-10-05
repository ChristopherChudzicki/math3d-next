import { validators } from "@/util";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

interface VariableSliderProperties {
  value: string;
  fps: string;
  min: string;
  max: string;
  duration: string;
  description: string;
  isAnimating: string; // eval to boolean;
  speedMultiplier: string; // eval to number;
}

const defaultValues: VariableSliderProperties = {
  value: "T=0",
  fps: "50",
  min: "-5",
  max: "+5",
  duration: "4",
  description: "Variable Slider",
  isAnimating: "false",
  speedMultiplier: "1",
};

const make: MathItemGenerator<
  MathItemType.VariableSlider,
  VariableSliderProperties
> = (id) => ({
  id,
  type: MathItemType.VariableSlider,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<
  MathItemType.VariableSlider,
  VariableSliderProperties
> = {
  type: MathItemType.VariableSlider,
  label: "Variable Slider",
  properties: {
    description,
    duration: {
      name: "duration",
      label: "Duration (at 1x)",
      widget: WidgetType.MathValue,
      validate: validators.positive,
    },
    fps: {
      name: "fps",
      label: "Frames per second",
      widget: WidgetType.MathValue,
      validate: validators.real,
    },
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
    value: {
      name: "value",
      label: "Value",
      widget: WidgetType.CustomMath,
      validate: validators.real,
    },
    isAnimating: {
      name: "isAnimating",
      label: "Animating",
      widget: WidgetType.MathBoolean,
    },
    speedMultiplier: {
      name: "speedMultiplier",
      label: "Speed Multiplier",
      widget: WidgetType.Custom,
      validate: validators.real,
    },
  },
  settingsProperties: ["duration"],
  make,
};

type VariableSlider = IMathItem<
  MathItemType.VariableSlider,
  VariableSliderProperties
>;

export type { VariableSliderProperties as Properties, VariableSlider };
export { config };
