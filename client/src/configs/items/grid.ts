import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import {
  description,
  color,
  opacity,
  visible,
  width,
  zBias,
  zIndex,
} from "../shared";

interface GridProperties {
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

const defaultValues: GridProperties = {
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

const make: MathItemGenerator<MathItemType.Grid, GridProperties> = (id) => ({
  id,
  type: MathItemType.Grid,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<MathItemType.Grid, GridProperties> = {
  type: MathItemType.Grid,
  label: "Grid",
  properties: {
    axes: {
      name: "axes",
      label: "Axes",
      widget: WidgetType.Text,
    },
    description,
    divisions: {
      name: "divisions",
      label: "Divisions",
      widget: WidgetType.MathValue,
      // number
    },
    color,
    opacity,
    snap: {
      name: "snap",
      label: "Snap",
      widget: WidgetType.MathBoolean,
    },
    visible,
    width,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "divisions",
    "opacity",
    "snap",
    "width",
    "zBias",
    "zIndex",
  ],
  make,
};

type Grid = IMathItem<MathItemType.Grid, GridProperties>;

export type { GridProperties, Grid };
export { config };
