import React, { useCallback, useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { Vector3 } from "three";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { fromUi, toUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import { cameraPatches } from "@/features/viewport/shared/cameraWriteBack";
import type { CameraPatch } from "@/features/viewport/shared/cameraWriteBack";
import { dolly, FOV_DOLLY_IN, FOV_DOLLY_OUT } from "./dollyZoom";

const { Controls } = MB.Threestrap;

const props = [
  "isRotateEnabled",
  "isZoomEnabled",
  "isPanEnabled",
  "position",
  "target",
  "updateOnDrag",
  "useRelative",
  "isOrthographic",
] as const;

type OnControlsChangeEnd = NonNullable<
  React.ComponentProps<typeof Controls>["onEnd"]
>;

type OnMoveEnd = (patches: CameraPatch[]) => void;

const useCoordinates = ({
  range,
  scale,
  useRelative = false,
}: {
  range: AxesRange;
  scale: [number, number, number];
  useRelative?: boolean;
}) => {
  const convert = useMemo(
    () => ({
      fromUi: (pos: Coords) => fromUi(pos, range, scale, useRelative),
      toUi: (pos: Coords) => toUi(pos, range, scale, useRelative),
    }),
    [range, useRelative, scale],
  );

  return { convert };
};

type CameraProps = {
  item: MathItem<MathItemType.Camera>;
  range: AxesRange;
  scale: [number, number, number];
  onMoveEnd?: OnMoveEnd;
};
const Camera: React.FC<CameraProps> = ({ item, range, scale, onMoveEnd }) => {
  invariant(range !== undefined, "Camera must have a range");
  const scope = useMathScope();
  const {
    isRotateEnabled,
    isZoomEnabled,
    isPanEnabled,
    position,
    updateOnDrag,
    useRelative,
    isOrthographic,
    target,
  } = useMathItemResults(scope, item, props);

  const { convert } = useCoordinates({ useRelative, range, scale });

  const threeTarget = useMemo(
    () => convert.fromUi(target ?? [0, 0, 0]),
    [target, convert],
  );
  // OrbitControls adopts this vector as its target and mutates it on pan.
  const controlsTarget = useMemo(
    () => new Vector3(...threeTarget),
    [threeTarget],
  );

  const threePos = useMemo(() => {
    if (!position) return undefined;
    const pos = convert.fromUi(position);
    return isOrthographic ? dolly.out(pos, threeTarget).toArray() : pos;
  }, [convert, position, threeTarget, isOrthographic]);

  const onEnd: OnControlsChangeEnd = useCallback(
    (e) => {
      if (!updateOnDrag) {
        if (threePos) {
          e.target.object.position.set(...threePos);
        }
        return;
      }
      const cameraPosition = e.target.object.position.toArray();
      const cameraTarget = e.target.target.toArray();
      const withoutDollyZoom = isOrthographic
        ? dolly.in(cameraPosition, cameraTarget).toArray()
        : cameraPosition;
      const newPosition = convert.toUi(withoutDollyZoom);
      const newTarget = convert.toUi(cameraTarget);
      const patches = cameraPatches(
        { position, target: target ?? [0, 0, 0] },
        { position: newPosition, target: newTarget },
      );
      if (patches) onMoveEnd?.(patches);
    },
    [
      onMoveEnd,
      convert,
      updateOnDrag,
      isOrthographic,
      threePos,
      position,
      target,
    ],
  );
  return (
    <>
      {/* MathBox moves the camera after OrbitControls aims it each frame, so
          aim it here too, or that frame renders aimed from the old spot. */}
      <MB.Camera
        proxy
        position={threePos}
        lookAt={threeTarget}
        fov={isOrthographic ? FOV_DOLLY_OUT : FOV_DOLLY_IN}
      />
      <Controls
        type="orbit"
        target={controlsTarget}
        enableRotate={isRotateEnabled}
        enablePan={isPanEnabled}
        enableZoom={isZoomEnabled}
        onEnd={onEnd}
      />
    </>
  );
};

export default Camera;
export type { OnMoveEnd };
