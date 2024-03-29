import { validators } from "@math3d/validators";
import { ParseableArray, ParseableObjs } from "@math3d/parser";
import { aggregate } from "@math3d/utils";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

interface VariableSliderProperties {
  value: ParseableObjs["assignment"];
  fps: string;
  range: ParseableArray<string>;
  duration: string;
  description: string;
  isAnimating: string;
  speedMultiplier: string;
}

const defaultValues: VariableSliderProperties = {
  value: { lhs: "T", rhs: "0", type: "assignment" },
  fps: "50",
  range: {
    type: "array",
    items: ["-5", "+5"],
  },
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

type EvaluatedProperties = {
  range: [number, number];
  duration: number;
  fps: number;
  value: number;
  speedMultiplier: number;
  isAnimating: boolean;
};

const config: IMathItemConfig<
  MathItemType.VariableSlider,
  VariableSliderProperties,
  EvaluatedProperties
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
    range: {
      name: "range",
      label: "Range",
      widget: WidgetType.MathValue,
      validate: (value) => {
        const array = validators.array(value);
        aggregate(array, (v) => validators.real(v));
        const [min, max] = array as [number, number];
        if (min >= max) {
          throw new Error("Minimum must be less than maximum.");
        }
        return [min, max];
      },
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
      validate: validators.boolean,
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

export type {
  VariableSliderProperties as Properties,
  VariableSlider,
  EvaluatedProperties,
};
export { config };
