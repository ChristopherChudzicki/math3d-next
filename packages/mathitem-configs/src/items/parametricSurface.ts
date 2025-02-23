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
  gridOpacity,
  grid1,
  grid2,
  gridWidth,
  opacity,
  domain2,
  shaded,
  samples1,
  visibilityProps,
  samples2,
  zBias,
  zIndex,
} from "../shared";
import type { EvaluatedDomain2 } from "../shared";

interface ParametricSurfaceProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: string;
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string; // eval to boolean;
  expr: ParseableObjs["function-assignment"];
  domain: ParseableArray<ParseableObjs["function-assignment"]>;
  colorExpr: ParseableObjs["function-assignment"];
  gridOpacity: string;
  gridWidth: string;
  samples1: string;
  samples2: string;
  grid1: string;
  grid2: string;
}

const defaultValues: ParametricSurfaceProperties = {
  description: "Parametric Surface",
  color: "#3090FF",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: {
    type: "function-assignment",
    name: "_f",
    params: ["u", "v"],
    rhs: "\\left[u\\cdot \\cos(v), u\\cdot \\sin(v), u \\right]",
  },
  domain: {
    type: "array",
    items: [
      {
        type: "function-assignment",
        name: "_f",
        params: ["v"],
        rhs: "\\left[-3, 3\\right]",
      },
      {
        type: "function-assignment",
        name: "_f",
        params: ["u"],
        rhs: "\\left[-\\pi, \\pi\\right]",
      },
    ],
  },
  colorExpr: {
    type: "function-assignment",
    name: "_f",
    params: ["X", "Y", "Z", "u", "v"],
    rhs: "mod(Z, 1)",
  },
  gridOpacity: "0.5",
  gridWidth: "2",
  samples1: "64",
  samples2: "64",
  grid1: "8",
  grid2: "8",
};

const make: MathItemGenerator<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
> = (id) => ({
  id,
  type: MathItemType.ParametricSurface,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  gridOpacity: number;
  grid1: number;
  grid2: number;
  gridWidth: number;
  opacity: number;
  domain: EvaluatedDomain2;
  shaded: boolean;
  samples1: number;
  samples2: number;
  calculatedVisibility: boolean;
  zBias: number;
  zIndex: number;
  expr: (u: number, v: number) => [number, number, number];
  colorExpr: (X: number, Y: number, Z: number, u: number, v: number) => number;
};

const config: IMathItemConfig<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties,
  EvaluatedProperties
> = {
  type: MathItemType.ParametricSurface,
  label: "Parametric Surface",
  properties: {
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[2][3],
    },
    colorExpr: {
      name: "colorExpr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[5][1],
    },
    color,
    description,
    domain: domain2,
    gridOpacity,
    grid1,
    grid2,
    gridWidth,
    opacity,
    shaded,
    samples1,
    samples2,
    ...visibilityProps,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "calculatedVisibility",
    "gridOpacity",
    "grid1",
    "grid2",
    "gridWidth",
    "opacity",
    "shaded",
    "samples1",
    "samples2",
    "visible",
    "zBias",
    "zIndex",
  ],
  make,
};

type ParametricSurface = IMathItem<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
>;

export type {
  ParametricSurface,
  ParametricSurfaceProperties,
  EvaluatedProperties,
};
export { config };
