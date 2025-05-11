import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  opacity,
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
} from "../shared";

interface GridProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;

  width: string;
  divisions: string;
  snap: string; // eval to boolean
  axes: "xy" | "yz" | "zx";
}

const defaultValues: GridProperties = {
  description: "Grid",
  axes: "xy",
  color: "#808080",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  width: "1/2",
  divisions: "[10, 10]",
  snap: "false",
};

const make: MathItemGenerator<MathItemType.Grid, GridProperties> = (id) => ({
  id,
  type: MathItemType.Grid,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  divisions: number[];
  opacity: number;
  calculatedVisibility: boolean;
  width: number;
  zBias: number;
  zIndex: number;
  zOrder: number;
  snap: boolean;
};

const config: IMathItemConfig<
  MathItemType.Grid,
  GridProperties,
  EvaluatedProperties
> = {
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
    ...visibilityProps,
    width,
    zBias,
    zIndex,
    zOrder,
  },
  settingsProperties: [
    "calculatedVisibility",
    "divisions",
    "opacity",
    "snap",
    "width",
    "zBias",
    "zIndex",
    "zOrder",
  ],
  make,
};

type Grid = IMathItem<MathItemType.Grid, GridProperties>;

export type { Grid, GridProperties, EvaluatedProperties };
export { config };
