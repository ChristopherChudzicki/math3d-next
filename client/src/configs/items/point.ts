import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

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

const config: MathItemConfig<MathItemType.Point, PointProperties> = {
  type: MathItemType.Point,
  label: "Point",
  properties: [
    {
      name: "coords",
      label: "Coordinates",
      widget: WidgetType.MathValue,
      primaryOnly: true,
      validate: (v) => {
        console.log("Hiii");
        if (!Array.isArray(v)) throw new Error("noooo");
        if (v.length !== 3) throw new Error("nooooo");
      },
    },
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
    {
      name: "size",
      label: "Size",
      widget: WidgetType.MathValue,
    },
    {
      name: "visible",
      label: "Visible",
      widget: WidgetType.MathBoolean,
    },
    {
      name: "color",
      label: "Color",
      widget: WidgetType.Color,
    },
    {
      name: "opacity",
      label: "Opacity",
      widget: WidgetType.MathValue,
    },
    {
      name: "zIndex",
      label: "Z-Index",
      widget: WidgetType.MathValue,
    },
    {
      name: "zBias",
      label: "Z-Bias",
      widget: WidgetType.MathValue,
    },
    {
      name: "label",
      label: "Label",
      widget: WidgetType.Text,
    },
    {
      name: "labelVisible",
      label: "Label Visibility",
      widget: WidgetType.MathBoolean,
    },
  ],
  make,
};

type Point = MathItemGeneric<MathItemType.Point, PointProperties>;

export type { PointProperties, Point };
export { config };
