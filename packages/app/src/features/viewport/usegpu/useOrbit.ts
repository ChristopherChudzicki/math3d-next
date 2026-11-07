import type React from "react";
import { useMemo, useRef, useState } from "react";
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { fromUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import type { CameraSpec } from "./graphicSpec/types";
import { toOrbit } from "./orbit";
import type { OrbitSpec } from "./orbit";
import { usePinchZoom } from "./usePinchZoom";
import { useOrbitWriteBack } from "./useOrbitWriteBack";

const CAMERA_PROPS = [
  "position",
  "target",
  "useRelative",
  "isRotateEnabled",
  "isPanEnabled",
  "isZoomEnabled",
  "isOrthographic",
  "updateOnDrag",
] as const;

/**
 * The camera item's evaluated values as orbit-control inputs, defaulted until
 * they evaluate, plus pinch zoom and the write-back that ends each move.
 */
export const useOrbit = (
  camera: MathItem<MathItemType.Camera>,
  range: AxesRange,
  scale: Coords,
  host: React.RefObject<HTMLElement | null>,
) => {
  const scope = useMathScope();
  const {
    position,
    target,
    useRelative,
    isRotateEnabled,
    isPanEnabled,
    isZoomEnabled,
    isOrthographic,
    updateOnDrag,
  } = useMathItemResults(scope, camera, CAMERA_PROPS);
  const controls = useMemo(
    () => ({
      rotate: isRotateEnabled ?? true,
      pan: isPanEnabled ?? true,
      zoom: isZoomEnabled ?? true,
    }),
    [isRotateEnabled, isPanEnabled, isZoomEnabled],
  );
  const spec = useMemo<CameraSpec>(
    () => ({
      position: fromUi(position ?? [0.5, -2, 0.5], range, scale, !!useRelative),
      target: fromUi(target ?? [0, 0, 0], range, scale, !!useRelative),
    }),
    [position, target, useRelative, range, scale],
  );
  // Keeps orbit.target's identity; see SceneSpec.orbit.
  const orbit = useMemo(() => toOrbit(spec), [spec]);
  const projection = useMemo(
    () => ({ dolly: isOrthographic ? 0 : 1 }),
    [isOrthographic],
  );
  const stored = useMemo(
    () => ({
      id: camera.id,
      position,
      target,
      useRelative: !!useRelative,
      updateOnDrag: !!updateOnDrag,
    }),
    [camera.id, position, target, useRelative, updateOnDrag],
  );
  const { onOrbit, controlsVersion, latest } = useOrbitWriteBack(
    host,
    stored,
    range,
    scale,
  );

  // A pinch reseeds only `radius`, so the controls keep the user's rotation
  // and pan. It lapses when the camera item changes or the controls snap back.
  const [pinch, setPinch] = useState<{
    seed: OrbitSpec;
    version: number;
    radius: number;
  } | null>(null);
  const startRadius = useRef(0);
  usePinchZoom(host, controls.zoom, {
    start: () => {
      startRadius.current = latest.current?.radius ?? orbit.radius;
    },
    move: (ratio) =>
      setPinch({
        seed: orbit,
        version: controlsVersion,
        radius: startRadius.current * ratio,
      }),
  });
  const seeded = useMemo(
    () =>
      pinch && pinch.seed === orbit && pinch.version === controlsVersion
        ? { ...orbit, radius: pinch.radius }
        : orbit,
    [pinch, orbit, controlsVersion],
  );

  return { orbit: seeded, controls, projection, controlsVersion, onOrbit };
};
