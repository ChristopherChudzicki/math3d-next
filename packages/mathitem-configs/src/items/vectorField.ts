import { validators } from "@math3d/validators";
import { ParseableArray, ParseableObjs } from "@math3d/parser";
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
  end,
  EvaluatedDomain3,
  opacity,
  samples1,
  samples2,
  samples3,
  size,
  start,
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
} from "../shared";

interface VectorFieldProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: string;
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;

  size: string;
  width: string;
  start: string; // eval to boolean;
  end: string; // eval to boolean;
  domain: ParseableArray<ParseableObjs["expr"]>;
  expr: ParseableObjs["function-assignment"];
  samples1: string;
  samples2: string;
  samples3: string;
  scale: string;
}

const defaultValues: VectorFieldProperties = {
  description: "Vector Field",
  color: "#3090FF",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  size: "6",
  width: "2",
  start: "false",
  end: "true",
  domain: {
    type: "array",
    items: [
      {
        type: "expr",
        expr: "\\left[-5, 5\\right]",
      },
      {
        type: "expr",
        expr: "\\left[-5, 5\\right]",
      },
      {
        type: "expr",
        expr: "\\left[-5, 5\\right]",
      },
    ],
  },
  expr: {
    type: "function-assignment",
    name: "_f",
    params: ["x", "y", "z"],
    rhs: "\\frac{\\left[y, -x, 0\\right]}{\\sqrt(x^2 + y^2)}",
  },
  samples1: "10",
  samples2: "10",
  samples3: "5",
  scale: "1",
};

const make: MathItemGenerator<
  MathItemType.VectorField,
  VectorFieldProperties
> = (id) => ({
  id,
  type: MathItemType.VectorField,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  opacity: number;
  calculatedVisibility: boolean;
  zBias: number;
  zIndex: number;
  zOrder: number | undefined;
  size: number;
  width: number;
  start: boolean;
  end: boolean;
  domain: EvaluatedDomain3;
  samples1: number;
  samples2: number;
  samples3: number;
  scale: number;
  expr: (x: number, y: number, z: number) => [number, number, number];
};

const config: IMathItemConfig<
  MathItemType.VectorField,
  VectorFieldProperties,
  EvaluatedProperties
> = {
  type: MathItemType.VectorField,
  label: "Vector Field",
  properties: {
    color,
    description,
    opacity,
    ...visibilityProps,
    zBias,
    zIndex,
    zOrder,
    size,
    width,
    start,
    end,
    domain: domain3,
    samples1,
    samples2,
    samples3,
    scale: {
      name: "scale",
      label: "Scale Multiplier",
      widget: WidgetType.MathValue,
      validate: validators.real,
    },
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[3][3],
    },
  },
  settingsProperties: [
    "calculatedVisibility",
    "opacity",
    "size",
    "start",
    "end",
    "samples1",
    "samples2",
    "samples3",
    "scale",
    "width",
    "zBias",
    "zOrder",
  ],
  make,
};

type VectorField = IMathItem<MathItemType.VectorField, VectorFieldProperties>;

export type { VectorField, VectorFieldProperties, EvaluatedProperties };
export { config };
