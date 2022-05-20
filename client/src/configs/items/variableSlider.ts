import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  name: string;
  value: string;
  min: string;
  max: string;
  description: string;
  isAnimating: string; // eval to boolean;
  speedMultiplier: string; // eval to number;
}

const defaultValues: Properties = {
  name: "T",
  value: "0",
  min: "-5",
  max: "5",
  description: "Variable Slider",
  isAnimating: "false",
  speedMultiplier: "1",
};

const make: MathItemGenerator<MathItemType.VariableSlider, Properties> = (
  id
) => ({
  id,
  type: MathItemType.VariableSlider,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.VariableSlider, Properties> = {
  type: MathItemType.VariableSlider,
  label: "Toggle Switch",
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

export type { Properties };
export { config };
