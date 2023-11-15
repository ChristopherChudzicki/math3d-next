import { ParseableObjs } from "@math3d/parser";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

interface VariableProperties {
  value: ParseableObjs["assignment"];
  description: string;
}

const defaultValues: VariableProperties = {
  value: { lhs: "f(x)", rhs: "x^2", type: "assignment" },
  description: "Variable or Function Assignment",
};

const make: MathItemGenerator<MathItemType.Variable, VariableProperties> = (
  id,
) => ({
  id,
  type: MathItemType.Variable,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  value: unknown;
};

const config: IMathItemConfig<
  MathItemType.Variable,
  VariableProperties,
  EvaluatedProperties
> = {
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

export type { Variable, VariableProperties, EvaluatedProperties };
export { config };
