import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface VariableProperties {
  value: string;
  description: string;
}

const defaultValues: VariableProperties = {
  value: "f(x) = x^2",
  description: "Variable or Function Assignment",
};

const make: MathItemGenerator<MathItemType.Variable, VariableProperties> = (
  id
) => ({
  id,
  type: MathItemType.Variable,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Variable, VariableProperties> = {
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

type Variable = MathItemGeneric<MathItemType.Variable, VariableProperties>;

export type { VariableProperties, Variable };
export { config };
