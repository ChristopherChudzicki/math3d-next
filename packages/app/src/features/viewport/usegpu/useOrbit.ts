import type React from "react";
import { useMemo, useRef, useState } from "react";
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { toOrbit } from "./orbit";
import type { OrbitSpec } from "./orbit";
import { usePinchZoom } from "./usePinchZoom";
import { useOrbitWriteBack } from "./useOrbitWriteBack";

const WRITE_BACK_PROPS = [
  "position",
  "target",
  "useRelative",
  "updateOnDrag",
] as const;

/**
 * Orbit-control inputs for the viewport's camera, plus pinch zoom and the
 * write-back that ends each move.
 */
export const useOrbit = (
  viewport: Pick<
    ViewportSpec,
    "camera" | "orthographic" | "controls" | "range" | "scale"
  >,
  cameraItem: MathItem<MathItemType.Camera>,
  host: React.RefObject<HTMLElement | null>,
) => {
  const { camera, orthographic, controls, range, scale } = viewport;
  const scope = useMathScope();
  const { position, target, useRelative, updateOnDrag } = useMathItemResults(
    scope,
    cameraItem,
    WRITE_BACK_PROPS,
  );
  // Keeps orbit.target's identity; see SceneSpec.orbit.
  const orbit = useMemo(() => toOrbit(camera), [camera]);
  const projection = useMemo(
    () => ({ dolly: orthographic ? 0 : 1 }),
    [orthographic],
  );
  const stored = useMemo(
    () => ({
      id: cameraItem.id,
      position,
      target,
      useRelative: !!useRelative,
      updateOnDrag: !!updateOnDrag,
    }),
    [cameraItem.id, position, target, useRelative, updateOnDrag],
  );
  const { onOrbit, controlsVersion, latest } = useOrbitWriteBack(
    host,
    stored,
    range,
    scale,
  );

  // OrbitControls re-seeds a field only when it changes, so changing `radius`
  // alone keeps the user's rotation and pan. Lapses on a camera edit or snap-back.
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

  return { orbit: seeded, projection, controlsVersion, onOrbit };
};
