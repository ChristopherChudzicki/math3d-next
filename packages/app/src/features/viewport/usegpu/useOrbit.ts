import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ViewportHooks, ViewportSpec } from "@math3d/viewport-spec";
import { fromOrbit, toOrbit } from "./orbit";
import type { OrbitSpec } from "./orbit";
import { usePinchZoom } from "./usePinchZoom";

/**
 * Orbit-control inputs for the viewport's camera, plus pinch zoom. `onOrbit`
 * reports the controls' orbit to `onCameraMove`; `controlsVersion` is the
 * spec's `cameraRevision`.
 */
export const useOrbit = (
  viewport: Pick<
    ViewportSpec,
    "camera" | "orthographic" | "controls" | "cameraRevision"
  >,
  onCameraMove: ViewportHooks["onCameraMove"],
  host: React.RefObject<HTMLElement | null>,
) => {
  const { camera, orthographic, controls } = viewport;
  const controlsVersion = viewport.cameraRevision;
  // Keeps orbit.target's identity; see SceneSpec.orbit.
  const orbit = useMemo(() => toOrbit(camera), [camera]);
  const projection = useMemo(
    () => ({ dolly: orthographic ? 0 : 1 }),
    [orthographic],
  );
  const latest = useRef<OrbitSpec | null>(null);
  const onOrbit = useCallback(
    (next: OrbitSpec) => {
      latest.current = next;
      onCameraMove(fromOrbit(next));
    },
    [onCameraMove],
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
