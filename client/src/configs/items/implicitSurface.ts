import { ParseableObjs } from "@/util/parsing";
import { validators } from "@/util/validators";
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
  shaded,
  visible,
  zBias,
  zIndex,
} from "../shared";

interface ImplicitSurfaceProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string; // eval to boolean;
  range1: string;
  range2: string;
  range3: string;
  lhs: ParseableObjs["assignment"];
  rhs: ParseableObjs["assignment"];
  samples: string;
}

const defaultValues: ImplicitSurfaceProperties = {
  description: "Implicit Surface",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  range1: "[-5, 5]",
  range2: "[-5, 5]",
  range3: "[-5, 5]",
  lhs: { lhs: "_f(x,y,z)", rhs: "x^2+y^2", type: "assignment" },
  rhs: { lhs: "_f(x,y,z)", rhs: "z^2+1", type: "assignment" },
  samples: "20",
};

const make: MathItemGenerator<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
> = (id) => ({
  id,
  type: MathItemType.ImplicitSurface,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  opacity: number;
  range1: [number, number];
  range2: [number, number];
  range3: [number, number];
  shaded: boolean;
  visible: boolean;
  zBias: number;
  zIndex: number;
};

const config: IMathItemConfig<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties,
  EvaluatedProperties
> = {
  type: MathItemType.ImplicitSurface,
  label: "Implicit Surface",
  properties: {
    color,
    description,
    opacity,
    visible,
    samples: {
      name: "samples",
      label: "Samples",
      widget: WidgetType.MathValue,
      // scalar value used for x, y, z... why different from other surfaces?
    },
    shaded,
    range1: {
      name: "range1",
      label: "Range X",
      widget: WidgetType.MathValue,
      validate: validators.realVec[2],
    },
    range2: {
      name: "range2",
      label: "Range X",
      widget: WidgetType.MathValue,
      validate: validators.realVec[2],
    },
    range3: {
      name: "range3",
      label: "Range X",
      widget: WidgetType.MathValue,
      validate: validators.realVec[2],
    },
    lhs: {
      name: "lhs",
      label: "Left-hand side",
      widget: WidgetType.MathValue,
    },
    rhs: {
      name: "rhs",
      label: "Right-hand side",
      widget: WidgetType.MathValue,
    },
    zBias,
    zIndex,
  },
  settingsProperties: [
    "opacity",
    "samples",
    "shaded",
    "visible",
    "zBias",
    "zIndex",
  ],
  make,
};

type ImplicitSurface = IMathItem<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
>;

export type { ImplicitSurface, ImplicitSurfaceProperties };
export { config };
