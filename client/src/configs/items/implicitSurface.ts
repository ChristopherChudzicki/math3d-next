import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface ImplicitSurfaceProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string; // eval to boolean;
  rangeX: string;
  rangeY: string;
  rangeZ: string;
  lhs: string;
  rhs: string;
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
  rangeX: "[-5, 5]",
  rangeY: "[-5, 5]",
  rangeZ: "[-5, 5]",
  lhs: "_f(x,y,z)=x^2+y^2",
  rhs: "_f(x,y,z)=z^2+1",
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

const config: MathItemConfig<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
> = {
  type: MathItemType.ImplicitSurface,
  label: "Implicit Surface",
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

type ImplicitSurface = MathItemGeneric<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
>;

export type { ImplicitSurfaceProperties, ImplicitSurface };
export { config };
