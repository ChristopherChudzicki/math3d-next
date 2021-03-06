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

const config: IMathItemConfig<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
> = {
  type: MathItemType.BooleanVariable,
  label: "Toggle Switch",
  properties: {
    description,
    value: {
      name: "value",
      label: "Value",
      widget: WidgetType.MathBoolean,
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
