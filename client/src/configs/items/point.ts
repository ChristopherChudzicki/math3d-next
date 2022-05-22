import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import {
  color,
  description,
  label,
  labelVisible,
  opacity,
  visible,
  size,
  zBias,
  zIndex,
} from "../shared";

interface PointProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  coords: string;
  size: string;
}

export interface EvaluatedProperties {
  description: string;
  color: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  zBias: number;

  label: string;
  labelVisible: boolean;
  coords: string;
  size: number;
}

const defaultValues: PointProperties = {
  coords: "[0, 0, 0]",
  description: "Point",
  size: "8",
  visible: "true",
  color: "#3090ff",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "",
  labelVisible: "false",
};

const make: MathItemGenerator<MathItemType.Point, PointProperties> = (id) => ({
  id,
  type: MathItemType.Point,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<MathItemType.Point, PointProperties> = {
  type: MathItemType.Point,
  label: "Point",
  properties: {
    color,
    coords: {
      name: "coords",
      label: "Coordinates",
      widget: WidgetType.MathValue,
      validate: (v) => {
        if (!Array.isArray(v)) throw new Error("noooo");
        if (v.length !== 3) throw new Error("nooooo");
      },
    },
    description,
    label,
    labelVisible,
    opacity,
    visible,
    size,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "label",
    "labelVisible",
    "opacity",
    "size",
    "zBias",
    "zIndex",
  ],
  make,
};

type Point = IMathItem<MathItemType.Point, PointProperties>;

export type { PointProperties, Point };
export { config };
