import { MathItemType, MathItemConfig, Widget } from "types/mathItem";

const config: MathItemConfig = {
  type: MathItemType.ImplicitSurface,
  label: "Implicit Surface",
  properties: [
    {
      name: "description",
      label: "Description",
      defaultValue: "",
      widget: Widget.AutosizeText,
      primaryOnly: true,
    },
  ],
};

export default config;
