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
  start: string; // eval to boolean;
  end: string; // eval to boolean;
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

const config: IMathItemConfig<MathItemType.Vector, VectorProperties> = {
  type: MathItemType.Vector,
  label: "Vector",
  properties: {
    color,
    components: {
      name: "components",
      label: "Components",
      widget: WidgetType.MathValue,
    },
    description,
    label,
    labelVisible,
    opacity,
    tail: {
      name: "tail",
      label: "Tail Coordinates",
      widget: WidgetType.MathValue,
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

export type { Vector, VectorProperties };
export { config };
