import { MathItemType, MathItemConfig, Widget } from "types/mathItem";

const config: MathItemConfig = {
  type: MathItemType.Vector,
  label: "Vector",
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
