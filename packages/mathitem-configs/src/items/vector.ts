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

interface VectorProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: string;
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
  components: string;
  tail: string;
}

const defaultValues: VectorProperties = {
  description: "Vector",
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
  end: "true",
  components: "[3,2,1]",
  tail: "[0,0,0]",
};

const make: MathItemGenerator<MathItemType.Vector, VectorProperties> = (
  id,
) => ({
  id,
  type: MathItemType.Vector,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  calculatedVisibility: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
  zOrder: number | undefined;
  start: boolean;
  end: boolean;
  labelVisible: boolean;
  opacity: number;
  tail: [number, number, number];
  components: [number, number, number];
};

const config: IMathItemConfig<
  MathItemType.Vector,
  VectorProperties,
  EvaluatedProperties
> = {
  type: MathItemType.Vector,
  label: "Vector",
  properties: {
    color,
    components: {
      name: "components",
      label: "Components",
      widget: WidgetType.MathValue,
      validate: validators.realVec[3],
    },
    description,
    label,
    labelVisible,
    opacity,
    tail: {
      name: "tail",
      label: "Tail Coordinates",
      widget: WidgetType.MathValue,
      validate: validators.realVec[3],
    },
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
    "tail",
    "width",
    "zBias",
    "zOrder",
  ],
  make,
};

type Vector = IMathItem<MathItemType.Vector, VectorProperties>;

export type { Vector, VectorProperties, EvaluatedProperties };
export { config };
