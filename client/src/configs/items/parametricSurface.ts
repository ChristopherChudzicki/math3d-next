import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string; // eval to boolean;
  expr: string;
  rangeU: string;
  rangeV: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  uSamples: string;
  vSamples: string;
  gridU: string;
  gridV: string;
}

const defaultValues: Properties = {
  description: "Parametric Surface",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: "_f(u,v)=[v*cos(u), v*sin(u), v]",
  rangeU: "[-pi, pi]",
  rangeV: "[-3, 3]",
  colorExpr: "_f(X, Y, Z, u, v)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  uSamples: "64",
  vSamples: "64",
  gridU: "8",
  gridV: "8",
};

const make: MathItemGenerator<MathItemType.ParametricSurface, Properties> = (
  id
) => ({
  id,
  type: MathItemType.ParametricSurface,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.ParametricSurface, Properties> = {
  type: MathItemType.ParametricSurface,
  label: "Toggle Switch",
  properties: [
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
  ],
  make,
};

type ParametricSurface = MathItemGeneric<
  MathItemType.ParametricSurface,
  Properties
>;

export type { Properties, ParametricSurface };
export { config };
