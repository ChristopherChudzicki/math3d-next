import { validators } from "@math3d/validators";
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
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
} from "../shared";

interface LineProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;
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
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
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
  coords: [number, number, number][];
  labelVisible: boolean;
  opacity: number;
  calculatedVisibility: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
  zOrder: number;
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
      validate: validators.oneOrMany(validators.realVec[3]),
    },
    description,
    label,
    labelVisible,
    opacity,
    ...visibilityProps,
    size,
    width,
    zBias,
    zIndex,
    zOrder,
    start,
    end,
  },
  settingsProperties: [
    "calculatedVisibility",
    "label",
    "labelVisible",
    "opacity",
    "size",
    "start",
    "end",
    "width",
    "zBias",
    "zOrder",
  ],
  make,
};

type Line = IMathItem<MathItemType.Line, LineProperties>;

export type { Line, LineProperties, EvaluatedProperties };
export { config };
