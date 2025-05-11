import { ParseableArray, ParseableObjs } from "@math3d/parser";
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
  domain3,
  EvaluatedDomain3,
  opacity,
  shaded,
  visibilityProps,
  zBias,
  zIndex,
  zOrder,
} from "../shared";

interface ImplicitSurfaceProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;
  shaded: string;
  domain: ParseableArray<ParseableObjs["expr"]>;
  lhs: ParseableObjs["function-assignment"];
  rhs: ParseableObjs["function-assignment"];
  samples: string;
}

const defaultValues: ImplicitSurfaceProperties = {
  description: "Implicit Surface",
  color: "#3090FF",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  shaded: "true",
  domain: {
    type: "array",
    items: [
      {
        type: "expr",
        expr: "[-5, 5]",
      },
      {
        type: "expr",
        expr: "[-5, 5]",
      },
      {
        type: "expr",
        expr: "[-5, 5]",
      },
    ],
  },
  lhs: {
    type: "function-assignment",
    name: "_f",
    params: ["x", "y", "z"],
    rhs: "x^2+y^2",
  },
  rhs: {
    type: "function-assignment",
    name: "_f",
    params: ["x", "y", "z"],
    rhs: "z^2 + 1",
  },
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
  domain: EvaluatedDomain3;
  shaded: boolean;
  calculatedVisibility: boolean;
  zBias: number;
  zIndex: number;
  zOrder: number;
  samples: number;
  lhs: (x: number, y: number, z: number) => number;
  rhs: (x: number, y: number, z: number) => number;
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
    ...visibilityProps,
    samples: {
      name: "samples",
      label: "Samples",
      widget: WidgetType.MathValue,
      validate: validators.positive,
    },
    shaded,
    domain: domain3,
    lhs: {
      name: "lhs",
      label: "Left-hand side",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[3][1],
    },
    rhs: {
      name: "rhs",
      label: "Right-hand side",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[3][1],
    },
    zBias,
    zIndex,
    zOrder,
  },
  settingsProperties: [
    "calculatedVisibility",
    "opacity",
    "samples",
    "shaded",
    "visible",
    "zBias",
    "zIndex",
    "zOrder",
  ],
  make,
};

type ImplicitSurface = IMathItem<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
>;

export type { ImplicitSurface, ImplicitSurfaceProperties, EvaluatedProperties };
export { config };
