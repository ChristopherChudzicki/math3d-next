import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface FolderProperties {
  description: string;
  isCollapsed: string; // eval to boolean;
}

const defaultValues: FolderProperties = {
  isCollapsed: "false",
  description: "Folder",
};

const make: MathItemGenerator<MathItemType.Folder, FolderProperties> = (
  id
) => ({
  id,
  type: MathItemType.Folder,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Folder, FolderProperties> = {
  type: MathItemType.Folder,
  label: "Folder",
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

type Folder = MathItemGeneric<MathItemType.Folder, FolderProperties>;

export type { FolderProperties, Folder };
export { config };
