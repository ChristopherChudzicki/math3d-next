import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

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

const config: MathItemConfig<MathItemType.Camera, CameraProperties> = {
  type: MathItemType.Camera,
  label: "Camera",
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

type Camera = MathItemGeneric<MathItemType.Camera, CameraProperties>;

export type { CameraProperties, Camera };
export { config };
