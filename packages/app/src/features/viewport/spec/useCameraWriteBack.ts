import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { debounce } from "lodash-es";
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { AxesRange, CameraSpec, Coords } from "@math3d/viewport-spec";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { toUi } from "@/features/viewport/shared/coordinates";
import { cameraPatches } from "@/features/viewport/shared/cameraWriteBack";

const WRITE_BACK_PROPS = [
  "position",
  "target",
  "useRelative",
  "updateOnDrag",
] as const;

/** How long after the last pointer release or wheel a camera move ends. */
export const MOVE_END_DELAY = 200;

/** Bumps when the stored camera, range or scale changes, and on `bump()`. */
const useStoredRevision = (
  camera: CameraSpec,
  range: AxesRange,
  scale: Coords,
): [number, () => void] => {
  const [seen, setSeen] = useState({ camera, range, scale, revision: 0 });
  let { revision } = seen;
  if (seen.camera !== camera || seen.range !== range || seen.scale !== scale) {
    // Set during render, so no render sees the new camera with the old revision.
    revision += 1;
    setSeen({ camera, range, scale, revision });
  }
  const bump = useCallback(
    () => setSeen((last) => ({ ...last, revision: last.revision + 1 })),
    [],
  );
  return [revision, bump];
};

/**
 * Ends each camera move `MOVE_END_DELAY` ms after the last
 * `pointerup`/`pointercancel`/`wheel` on `host`, unless a pointer is still
 * down. A move that went somewhere is written to the camera item when
 * `updateOnDrag`, and otherwise bumps `cameraRevision` so the view snaps back.
 *
 * `camera` is the stored camera in view coordinates; `cameraRevision` also
 * bumps whenever it or the axes' range or scale changes.
 */
export const useCameraWriteBack = (
  host: RefObject<HTMLElement | null>,
  cameraItem: MathItem<MathItemType.Camera>,
  camera: CameraSpec,
  range: AxesRange,
  scale: Coords,
): { cameraRevision: number; onCameraMove: (camera: CameraSpec) => void } => {
  const dispatch = useAppDispatch();
  const scope = useMathScope();
  const { position, target, useRelative, updateOnDrag } = useMathItemResults(
    scope,
    cameraItem,
    WRITE_BACK_PROPS,
  );
  const [cameraRevision, bump] = useStoredRevision(camera, range, scale);
  const latest = useRef<CameraSpec | null>(null);
  const onCameraMove = useCallback((next: CameraSpec) => {
    latest.current = next;
  }, []);

  const onMoveEnd = useCallback(() => {
    const moved = latest.current;
    // Consumed, so a later click with no move writes or snaps nothing.
    latest.current = null;
    if (!moved) return;
    const patches = cameraPatches(
      { position, target: target ?? [0, 0, 0] },
      {
        position: toUi(moved.position, range, scale, !!useRelative),
        target: toUi(moved.target, range, scale, !!useRelative),
      },
    );
    if (!patches) return;
    if (!updateOnDrag) {
      bump();
      return;
    }
    patches.forEach((patch) =>
      dispatch(actions.patchProperty({ id: cameraItem.id, ...patch })),
    );
  }, [
    position,
    target,
    useRelative,
    updateOnDrag,
    range,
    scale,
    bump,
    dispatch,
    cameraItem.id,
  ]);
  const onMoveEndRef = useRef(onMoveEnd);
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const down = new Set<number>();
    const end = debounce(() => {
      if (down.size === 0) onMoveEndRef.current();
    }, MOVE_END_DELAY);
    const press = (e: PointerEvent) => {
      down.add(e.pointerId);
    };
    const release = (e: PointerEvent) => {
      down.delete(e.pointerId);
      end();
    };
    // Capture phase: Use.GPU's controls stop these events on their canvas.
    const options = { capture: true };
    el.addEventListener("pointerdown", press, options);
    el.addEventListener("pointerup", release, options);
    el.addEventListener("pointercancel", release, options);
    el.addEventListener("wheel", end, options);
    return () => {
      el.removeEventListener("pointerdown", press, options);
      el.removeEventListener("pointerup", release, options);
      el.removeEventListener("pointercancel", release, options);
      el.removeEventListener("wheel", end, options);
      end.cancel();
    };
  }, [host]);

  return { cameraRevision, onCameraMove };
};
