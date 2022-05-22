import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import { description } from "../shared";

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

const config: IMathItemConfig<MathItemType.Variable, VariableProperties> = {
  type: MathItemType.Variable,
  label: "Variable or Function",
  properties: {
    description,
    value: {
      name: "value",
      label: "Value",
      widget: WidgetType.MathValue,
    },
  },
  settingsProperties: [],
  make,
};

type Variable = IMathItem<MathItemType.Variable, VariableProperties>;

export type { VariableProperties, Variable };
export { config };
