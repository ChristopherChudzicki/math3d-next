import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface ExplicitSurfaceProperties {
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

const defaultValues: ExplicitSurfaceProperties = {
  description: "Explicit Surface",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: "_f(x,y)=x^2-y^2",
  rangeU: "[-2, 2]",
  rangeV: "[-2, 2]",
  colorExpr: "_f(X, Y, Z, x, y)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  uSamples: "64",
  vSamples: "64",
  gridU: "8",
  gridV: "8",
};

const make: MathItemGenerator<
  MathItemType.ExplicitSurface,
  ExplicitSurfaceProperties
> = (id) => ({
  id,
  type: MathItemType.ExplicitSurface,
  properties: { ...defaultValues },
});

const config: MathItemConfig<
  MathItemType.ExplicitSurface,
  ExplicitSurfaceProperties
> = {
  type: MathItemType.ExplicitSurface,
  label: "Explicit Surface",
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

type ExplicitSurface = MathItemGeneric<
  MathItemType.ExplicitSurface,
  ExplicitSurfaceProperties
>;

export type { ExplicitSurfaceProperties, ExplicitSurface };
export { config };