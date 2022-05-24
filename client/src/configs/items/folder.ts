import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import { description } from "../shared";

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

const config: IMathItemConfig<MathItemType.Folder, FolderProperties> = {
  type: MathItemType.Folder,
  label: "Folder",
  properties: {
    description,
    isCollapsed: {
      name: "isCollapsed",
      label: "Collapse Folder",
      widget: WidgetType.MathBoolean,
    },
  },
  settingsProperties: [],
  make,
};

type Folder = IMathItem<MathItemType.Folder, FolderProperties>;

export type { FolderProperties, Folder };
export { config };
