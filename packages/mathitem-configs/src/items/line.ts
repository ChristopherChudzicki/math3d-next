import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  end,
  label,
  labelVisible,
  opacity,
  size,
  start,
  visible,
  width,
  zBias,
  zIndex,
} from "../shared";

interface LineProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;
  label: string;
  labelVisible: string;
  size: string;
  width: string;
  start: string;
  end: string;
  coords: string;
}

const defaultValues: LineProperties = {
  description: "Line",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "",
  labelVisible: "false",
  size: "6",
  width: "4",
  start: "false",
  end: "false",
  coords: "[[-1,1,-1],[1,1,1]]",
};

const make: MathItemGenerator<MathItemType.Line, LineProperties> = (id) => ({
  id,
  type: MathItemType.Line,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  coords: [number, number, number] | [number, number, number][];
  labelVisible: boolean;
  opacity: number;
  visible: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
  start: boolean;
  end: boolean;
};

const config: IMathItemConfig<
  MathItemType.Line,
  LineProperties,
  EvaluatedProperties
> = {
  type: MathItemType.Line,
  label: "Line",
  properties: {
    color,
    coords: {
      name: "coords",
      label: "Coordinates",
      widget: WidgetType.MathValue,
    },
    description,
    label,
    labelVisible,
    opacity,
    visible,
    size,
    width,
    zBias,
    zIndex,
    start,
    end,
  },
  settingsProperties: [
    "label",
    "labelVisible",
    "opacity",
    "size",
    "start",
    "end",
    "width",
    "zBias",
    "zIndex",
  ],
  make,
};

type Line = IMathItem<MathItemType.Line, LineProperties>;

export type { Line, LineProperties, EvaluatedProperties };
export { config };
