import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  description: string;
  isCollapsed: boolean; // eval to boolean;
}

const defaultValues: Properties = {
  isCollapsed: false,
  description: "Folder",
};

const make: MathItemGenerator<MathItemType.Folder, Properties> = (id) => ({
  id,
  type: MathItemType.Folder,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Folder, Properties> = {
  type: MathItemType.Folder,
  label: "Toggle Switch",
  properties: [
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
  ],
  make,
};

export type { Properties };
export { config };
