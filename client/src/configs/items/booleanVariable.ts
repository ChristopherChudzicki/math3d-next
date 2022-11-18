import { validators } from "@/util/validators";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

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

type EvaluatedProperties = {
  value: boolean;
};

const config: IMathItemConfig<
  MathItemType.BooleanVariable,
  BooleanVariableProperties,
  EvaluatedProperties
> = {
  type: MathItemType.BooleanVariable,
  label: "Toggle Switch",
  properties: {
    description,
    value: {
      name: "value",
      label: "Value",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
  },
  settingsProperties: [],
  make,
};

type BooleanVariable = IMathItem<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
>;

export type { BooleanVariable, BooleanVariableProperties };
export { config };
