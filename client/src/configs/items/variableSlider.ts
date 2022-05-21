import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface VariableSliderProperties {
  name: string;
  value: string;
  min: string;
  max: string;
  description: string;
  isAnimating: string; // eval to boolean;
  speedMultiplier: string; // eval to number;
}

const defaultValues: VariableSliderProperties = {
  name: "T",
  value: "0",
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

const config: MathItemConfig<
  MathItemType.VariableSlider,
  VariableSliderProperties
> = {
  type: MathItemType.VariableSlider,
  label: "Variable Slider",
  properties: [
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
  ],
  make,
};

type VariableSlider = MathItemGeneric<
  MathItemType.VariableSlider,
  VariableSliderProperties
>;

export type { VariableSliderProperties as Properties, VariableSlider };
export { config };
