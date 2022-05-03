import { MathItemType, Variable, MathItemConfig, Widget } from "types/mathItem";

const defaultValues: Variable['properties'] = {
  name: 'f(x)',
  value: 'e^x',
  description: 'Variable or Function'
}

const config: MathItemConfig = {
  type: MathItemType.Variable,
  label: "Variable",
  properties: [
    {
      name: "description",
      label: "Description",
      defaultValue: defaultValues.description,
      widget: Widget.AutosizeText,
      primaryOnly: true,
    },
    {
      name: "name",
      label: "Name",
      defaultValue: defaultValues.name,
      widget: Widget.MathValue,
      primaryOnly: true,
    },
    {
      name: "value",
      label: "Value",
      defaultValue: defaultValues.value,
      widget: Widget.MathValue,
      primaryOnly: true,
    },
  ],
};

export { config, defaultValues };
