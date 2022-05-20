import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  value: string;
  description: string;
}

const defaultValues: Properties = {
  value: "f(x) = x^2",
  description: "Variable or Function Assignment",
};

const make: MathItemGenerator<MathItemType.Variable, Properties> = (id) => ({
  id,
  type: MathItemType.Variable,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Variable, Properties> = {
  type: MathItemType.Variable,
  label: "Variable or Function",
  properties: [
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
    {
      name: "value",
      label: "Value",
      widget: WidgetType.MathEquality,
      primaryOnly: true,
    },
  ],
  make,
};

export type { Properties };
export { config };
