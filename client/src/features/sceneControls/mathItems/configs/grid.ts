import { MathItemType, MathItemConfig, Widget } from "types/mathItem";

const config: MathItemConfig = {
  type: MathItemType.Grid,
  label: "Grid",
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
