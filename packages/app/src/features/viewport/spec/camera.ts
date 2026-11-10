import { useMemo } from "react";
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { AxesRange, Coords, ViewportSpec } from "@math3d/viewport-spec";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { fromUi } from "@/features/viewport/shared/coordinates";

const CAMERA_PROPS = [
  "position",
  "target",
  "useRelative",
  "isRotateEnabled",
  "isPanEnabled",
  "isZoomEnabled",
  "isOrthographic",
] as const;

type CameraFields = Pick<ViewportSpec, "camera" | "orthographic" | "controls">;

/** The camera item's part of `ViewportSpec`, defaulted until it evaluates. */
export const useCameraSpec = (
  camera: MathItem<MathItemType.Camera>,
  range: AxesRange,
  scale: Coords,
): CameraFields => {
  const scope = useMathScope();
  const {
    position,
    target,
    useRelative,
    isRotateEnabled,
    isPanEnabled,
    isZoomEnabled,
    isOrthographic,
  } = useMathItemResults(scope, camera, CAMERA_PROPS);
  const spec = useMemo(
    () => ({
      position: fromUi(position ?? [0.5, -2, 0.5], range, scale, !!useRelative),
      target: fromUi(target ?? [0, 0, 0], range, scale, !!useRelative),
    }),
    [position, target, useRelative, range, scale],
  );
  const controls = useMemo(
    () => ({
      rotate: isRotateEnabled ?? true,
      pan: isPanEnabled ?? true,
      zoom: isZoomEnabled ?? true,
    }),
    [isRotateEnabled, isPanEnabled, isZoomEnabled],
  );
  const orthographic = !!isOrthographic;
  return useMemo(
    () => ({ camera: spec, orthographic, controls }),
    [spec, orthographic, controls],
  );
};
