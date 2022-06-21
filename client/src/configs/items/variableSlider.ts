import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

interface VariableSliderProperties {
  value: string;
  min: string;
  max: string;
  description: string;
  isAnimating: string; // eval to boolean;
  speedMultiplier: string; // eval to number;
}

const defaultValues: VariableSliderProperties = {
  value: "T=0",
  min: "-5",
  max: "5",
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
    min: {
      name: "min",
      label: "Min",
      widget: WidgetType.MathValue,
      // validate number
    },
    max: {
      name: "max",
      label: "Max",
      widget: WidgetType.MathValue,
      // validate number
    },
    value: {
      name: "value",
      label: "Value",
      widget: WidgetType.MathValue,
    },
    isAnimating: {
      name: "isAnimating",
      label: "Animating",
      widget: WidgetType.MathBoolean,
    },
    speedMultiplier: {
      name: "speedMultiplier",
      label: "Speed Multiplier",
      widget: WidgetType.MathValue,
    },
  },
  settingsProperties: [],
  make,
};

type VariableSlider = IMathItem<
  MathItemType.VariableSlider,
  VariableSliderProperties
>;

export type { VariableSliderProperties as Properties, VariableSlider };
export { config };
