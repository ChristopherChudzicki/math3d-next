import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  width: string;
  divisions: string;
  snap: string; // eval to boolean
  axes: "xy" | "yz" | "zx";
}

const defaultValues: Properties = {
  description: "Grid",
  axes: "xy",
  color: "#808080",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  width: "1/2",
  divisions: "[10, 10]",
  snap: "false",
};

const make: MathItemGenerator<MathItemType.Grid, Properties> = (id) => ({
  id,
  type: MathItemType.Grid,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Grid, Properties> = {
  type: MathItemType.Grid,
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
