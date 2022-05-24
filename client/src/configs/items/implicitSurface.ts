import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
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

const config: IMathItemConfig<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
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
    rangeX: {
      name: "rangeX",
      label: "Range X",
      widget: WidgetType.MathValue,
    },
    rangeY: {
      name: "rangeY",
      label: "Range X",
      widget: WidgetType.MathValue,
    },
    rangeZ: {
      name: "rangeZ",
      label: "Range X",
      widget: WidgetType.MathValue,
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

export type { ImplicitSurfaceProperties, ImplicitSurface };
export { config };
