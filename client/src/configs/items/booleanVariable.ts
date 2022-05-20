import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  value: string; // eval to boolean
  description: string;
}

const defaultValues: Properties = {
  value: "switch=true",
  description: "Toggle switch",
};

const make: MathItemGenerator<MathItemType.BooleanVariable, Properties> = (
  id
) => ({
  id,
  type: MathItemType.BooleanVariable,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.BooleanVariable, Properties> = {
  type: MathItemType.BooleanVariable,
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
