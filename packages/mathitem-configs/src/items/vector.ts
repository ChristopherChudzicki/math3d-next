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
  visible,
  width,
  zBias,
  zIndex,
} from "../shared";

interface VectorProperties {
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
  components: string;
  tail: string;
}

const defaultValues: VectorProperties = {
  description: "Vector",
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
  end: "true",
  components: "[3,2,1]",
  tail: "[0,0,0]",
};

const make: MathItemGenerator<MathItemType.Vector, VectorProperties> = (
  id
) => ({
  id,
  type: MathItemType.Vector,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  visible: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
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
    "tail",
    "width",
    "zBias",
    "zIndex",
  ],
  make,
};

type Vector = IMathItem<MathItemType.Vector, VectorProperties>;

export type { Vector, VectorProperties, EvaluatedProperties };
export { config };
