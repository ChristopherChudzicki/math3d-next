import { MathItemType, MathItemConfig, Widget } from "types/mathItem";

const config: MathItemConfig = {
  type: MathItemType.Folder,
  label: "Folder",
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
