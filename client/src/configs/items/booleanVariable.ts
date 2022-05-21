import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface BooleanVariableProperties {
  value: string; // eval to boolean
  description: string;
}

const defaultValues: BooleanVariableProperties = {
  value: "switch=true",
  description: "Toggle switch",
};

const make: MathItemGenerator<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
> = (id) => ({
  id,
  type: MathItemType.BooleanVariable,
  properties: { ...defaultValues },
});

const config: MathItemConfig<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
> = {
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

type BooleanVariable = MathItemGeneric<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
>;

export type { BooleanVariableProperties, BooleanVariable };
export { config };
