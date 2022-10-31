import { ParseableObjs } from "@/util/parsing";
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
  visible,
  width,
  zBias,
  zIndex,
} from "../shared";

interface VectorFieldProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  size: string;
  width: string;
  start: string; // eval to boolean;
  end: string; // eval to boolean;
  domain: ParseableObjs["array"];
  expr: string;
  samples1: string;
  samples2: string;
  samples3: string;
  scale: string;
}

const defaultValues: VectorFieldProperties = {
  description: "Vector Field",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  size: "6",
  width: "2",
  start: "false",
  end: "true",
  domain: {
    type: "array",
    items: [
      {
        type: "assignment",
        lhs: "_f(y, z)",
        rhs: "[-5, 5]",
      },
      {
        type: "assignment",
        lhs: "_f(x, z)",
        rhs: "[-5, 5]",
      },
      {
        type: "assignment",
        lhs: "_f(x, y)",
        rhs: "[-5, 5]",
      },
    ],
  },
  expr: "_f(x,y,z)=[y, -x]/sqrt(x^2 + y^2)",
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
  visible: boolean;
  zBias: number;
  zIndex: number;
  size: number;
  width: number;
  start: boolean;
  end: boolean;
  domain: EvaluatedDomain3;
  samples1: number;
  samples2: number;
  samples3: number;
  scale: number;
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
    visible,
    zBias,
    zIndex,
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
    },
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
    },
  },
  settingsProperties: [
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
    "zIndex",
  ],
  make,
};

type VectorField = IMathItem<MathItemType.VectorField, VectorFieldProperties>;

export type { VectorField, VectorFieldProperties };
export { config };
