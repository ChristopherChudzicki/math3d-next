import { validators } from "@/util/validators";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import { description } from "../shared";

interface CameraProperties {
  description: string;
  isOrthographic: string;
  isPanEnabled: string;
  isZoomEnabled: string;
  isRotateEnabled: string;
  computedPosition: string;
  computedTarget: string;
  useComputed: string;
}

const defaultValues: CameraProperties = {
  description: "Camera",
  isOrthographic: "false",
  isPanEnabled: "false",
  isZoomEnabled: "true",
  isRotateEnabled: "true",
  computedPosition: "[-6, -4, 2]",
  computedTarget: "[0, 0, 0]",
  useComputed: "false",
};

type EvaluatedProperties = {
  isOrthographic: boolean;
  isPanEnabled: boolean;
  isZoomEnabled: boolean;
  isRotateEnabled: boolean;
  useComputed: boolean;
  computedPosition: [number, number, number];
  computedTarget: [number, number, number];
};

const make: MathItemGenerator<MathItemType.Camera, CameraProperties> = (
  id
) => ({
  id,
  type: MathItemType.Camera,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<
  MathItemType.Camera,
  CameraProperties,
  EvaluatedProperties
> = {
  type: MathItemType.Camera,
  label: "Camera",
  properties: {
    description,
    isOrthographic: {
      name: "isOrthographic",
      label: "Use orthographic projection",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    isPanEnabled: {
      name: "isPanEnabled",
      label: "Pan",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    isZoomEnabled: {
      name: "isZoomEnabled",
      label: "Zoom",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    isRotateEnabled: {
      name: "isRotateEnabled",
      label: "Rotate",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    useComputed: {
      name: "useComputed",
      label: "Active",
      widget: WidgetType.MathBoolean,
      validate: validators.boolean,
    },
    computedPosition: {
      name: "computedPosition",
      label: "Position",
      widget: WidgetType.MathValue,
      validate: validators.realVec[3],
    },
    computedTarget: {
      name: "computedTarget",
      label: "Look At",
      widget: WidgetType.MathValue,
      validate: validators.realVec[3],
    },
  },
  settingsProperties: [],
  make,
};

type Camera = IMathItem<MathItemType.Camera, CameraProperties>;

export type { Camera, CameraProperties, EvaluatedProperties };
export { config };
