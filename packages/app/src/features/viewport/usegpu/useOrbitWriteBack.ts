import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { debounce } from "lodash-es";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { toUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import { cameraPatches } from "@/features/viewport/shared/cameraWriteBack";
import { fromOrbit } from "./orbit";
import type { OrbitSpec } from "./orbit";

/** The camera item's evaluated values, in the coordinates it stores. */
type StoredCamera = {
  id: string;
  position: Coords | undefined;
  target: Coords | undefined;
  useRelative: boolean;
  updateOnDrag: boolean;
};

/**
 * Ends each camera move 200 ms after the last `pointerup`/`wheel` on `host`:
 * writes it to the camera item when `updateOnDrag`, else bumps
 * `controlsVersion` so the controls snap back.
 */
const useOrbitWriteBack = (
  host: RefObject<HTMLElement | null>,
  camera: StoredCamera,
  range: AxesRange,
  scale: Coords,
): { onOrbit: (orbit: OrbitSpec) => void; controlsVersion: number } => {
  const dispatch = useAppDispatch();
  const latest = useRef<OrbitSpec | null>(null);
  const [controlsVersion, setControlsVersion] = useState(0);
  const onOrbit = useCallback((orbit: OrbitSpec) => {
    latest.current = orbit;
  }, []);

  const onMoveEnd = useCallback(() => {
    if (!latest.current) return;
    const next = fromOrbit(latest.current);
    const patches = cameraPatches(
      { position: camera.position, target: camera.target ?? [0, 0, 0] },
      {
        position: toUi(next.position, range, scale, camera.useRelative),
        target: toUi(next.target, range, scale, camera.useRelative),
      },
    );
    if (!patches) return;
    if (!camera.updateOnDrag) {
      setControlsVersion((v) => v + 1);
      return;
    }
    patches.forEach((patch) =>
      dispatch(actions.patchProperty({ id: camera.id, ...patch })),
    );
  }, [camera, range, scale, dispatch]);
  const onMoveEndRef = useRef(onMoveEnd);
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const end = debounce(() => onMoveEndRef.current(), 200);
    // Capture phase: the orbit controls stop these events on the canvas.
    const options = { capture: true };
    const cancel = () => end.cancel();
    el.addEventListener("pointerdown", cancel, options);
    el.addEventListener("pointerup", end, options);
    el.addEventListener("wheel", end, options);
    return () => {
      el.removeEventListener("pointerdown", cancel, options);
      el.removeEventListener("pointerup", end, options);
      el.removeEventListener("wheel", end, options);
      end.cancel();
    };
  }, [host]);

  return { onOrbit, controlsVersion };
};

export { useOrbitWriteBack };
export type { StoredCamera };
