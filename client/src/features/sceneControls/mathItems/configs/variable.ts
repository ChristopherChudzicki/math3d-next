import { MathItemType as MIT, Variable, MathItemConfig, Widget, MathItemGenerator } from "types/mathItem";

const defaultValues: Variable['properties'] = {
  name: 'f(x)',
  value: 'e^x',
  description: 'Variable or Function'
}

export const make: MathItemGenerator<MIT.Variable> = (id) => ({
  id,
  type: MIT.Variable,
  properties: {...defaultValues}
})

const config: MathItemConfig = {
  type: MIT.Variable,
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
