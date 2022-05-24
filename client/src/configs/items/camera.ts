import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import { description } from "../shared";

interface CameraProperties {
  description: string;
  isOrthographic: string; // eval to boolean
  isPanEnabled: string; // eval to boolean
  isZoomEnabled: string; // eval to boolean
  isRotateEnabled: string; // eval to boolean
  // relativePosition: number[];
  // relativeLookAt: number[];
  computedPosition: string;
  computedLookAt: string;
  useComputed: string; // eval to boolean
}

const defaultValues: CameraProperties = {
  description: "Camera",
  isOrthographic: "false",
  isPanEnabled: "false",
  isZoomEnabled: "true",
  isRotateEnabled: "true",
  computedPosition: "[-6, -4, 2]",
  computedLookAt: "[0, 0, 0]",
  useComputed: "false",
};

const make: MathItemGenerator<MathItemType.Camera, CameraProperties> = (
  id
) => ({
  id,
  type: MathItemType.Camera,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<MathItemType.Camera, CameraProperties> = {
  type: MathItemType.Camera,
  label: "Camera",
  properties: {
    description,
    isOrthographic: {
      name: "isOrthographic",
      label: "Orthographic",
      widget: WidgetType.MathBoolean,
    },
    isPanEnabled: {
      name: "isPanEnabled",
      label: "Pan",
      widget: WidgetType.MathBoolean,
    },
    isZoomEnabled: {
      name: "isZoomEnabled",
      label: "Zoom",
      widget: WidgetType.MathBoolean,
    },
    isRotateEnabled: {
      name: "isRotateEnabled",
      label: "Rotate",
      widget: WidgetType.MathBoolean,
    },
    useComputed: {
      name: "useComputed",
      label: "Use Computed",
      widget: WidgetType.MathBoolean,
    },
    computedPosition: {
      name: "computedPosition",
      label: "Position",
      widget: WidgetType.MathValue,
    },
    computedLookAt: {
      name: "computedLookAt",
      label: "Look At",
      widget: WidgetType.MathValue,
    },
  },
  settingsProperties: [],
  make,
};

type Camera = IMathItem<MathItemType.Camera, CameraProperties>;

export type { CameraProperties, Camera };
export { config };
