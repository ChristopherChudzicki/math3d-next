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
  shaded,
  samples1,
  visibilityProps,
  samples2,
  zBias,
  zIndex,
  zOrder,
  domain2,
  EvaluatedDomain2,
} from "../shared";

interface ExplicitSurfacePolarProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;
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

const defaultValues: ExplicitSurfacePolarProperties = {
  description: "Explicit Surface (Polar)",
  color: "#3090FF",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  shaded: "true",
  expr: {
    type: "function-assignment",
    name: "_f",
    params: ["r", "\\theta"],
    rhs: "\\frac{1}{4} \\cdot r^2 \\cdot cos(3\\theta)",
  },
  domain: {
    type: "array",
    items: [
      {
        type: "function-assignment",
        name: "_f",
        params: ["Q"],
        rhs: "[0, 3]",
      },
      {
        type: "function-assignment",
        name: "_f",
        params: ["r"],
        rhs: "[-pi, pi]",
      },
    ],
  },
  colorExpr: {
    type: "function-assignment",
    name: "_f",
    params: ["X", "Y", "Z", "r", "\\theta"],
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
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
> = (id) => ({
  id,
  type: MathItemType.ExplicitSurfacePolar,
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
  zOrder: number | undefined;
  expr: (x: number, y: number) => number;
  colorExpr: (X: number, Y: number, Z: number, u: number, v: number) => number;
};

const config: IMathItemConfig<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties,
  EvaluatedProperties
> = {
  type: MathItemType.ExplicitSurfacePolar,
  label: "Explicit Surface (Polar)",
  properties: {
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[2][1],
    },
    colorExpr: {
      name: "colorExpr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[5][1],
    },
    color,
    description,
    gridOpacity,
    grid1,
    grid2,
    gridWidth,
    opacity,
    domain: domain2,
    shaded,
    samples1,
    samples2,
    ...visibilityProps,
    zBias,
    zIndex,
    zOrder,
  },
  settingsProperties: [
    "gridOpacity",
    "grid1",
    "grid2",
    "gridWidth",
    "opacity",
    "shaded",
    "samples1",
    "samples2",
    "calculatedVisibility",
    "zBias",
    "zOrder",
  ],
  make,
};

type ExplicitSurfacePolar = IMathItem<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
>;

export type {
  ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties,
  EvaluatedProperties,
};
export { config };
