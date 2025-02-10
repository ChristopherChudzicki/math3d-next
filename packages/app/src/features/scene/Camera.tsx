import React, { useCallback, useMemo } from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { Vector3 } from "three";
import { useMathItemResults } from "../sceneControls/mathItems/mathScope";
import { useMathScope } from "../sceneControls/mathItems/sceneSlice/index";
import type { AxesRange, Coords } from "./graphics/interfaces";
import { project } from "./graphics/util";
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

const UNIT_RANGE: AxesRange = [
  [-1, 1],
  [-1, 1],
  [-1, 1],
];

type OnControlsChangeEnd = NonNullable<
  React.ComponentProps<typeof Controls>["onEnd"]
>;

type OnMoveEnd = ({
  position,
  target,
}: {
  position: [number, number, number];
  target: [number, number, number];
}) => void;

const useCoordinates = ({
  range,
  scale,
  useRelative = false,
}: {
  range: AxesRange;
  scale: [number, number, number];
  useRelative?: boolean;
}) => {
  const convert = useMemo(() => {
    const threeJsRange: AxesRange = [
      [-scale[0], scale[0]],
      [-scale[1], scale[1]],
      [-scale[2], scale[2]],
    ];
    return {
      fromUi: (pos: Coords) => {
        if (useRelative) return pos.map((p, i) => p * scale[i]) as Coords;
        return project(pos, range, threeJsRange);
      },
      toUi: (pos: Coords) => {
        if (useRelative) return pos.map((p, i) => p / scale[i]) as Coords;
        return project(pos, threeJsRange, range);
      },
    };
  }, [range, useRelative, scale]);

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

  const controlsTarget = useMemo(() => {
    return new Vector3(...convert.fromUi(target ?? [0, 0, 0]));
  }, [target, convert]);

  const threePos = useMemo(() => {
    if (!position) return undefined;
    const pos = convert.fromUi(position);
    const targ = convert.fromUi(target ?? [0, 0, 0]);
    return isOrthographic ? dolly.out(pos, targ).toArray() : pos;
  }, [convert, position, target, isOrthographic]);

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
      onMoveEnd?.({
        position: convert.toUi(withoutDollyZoom),
        target: convert.toUi(cameraTarget),
      });
    },
    [onMoveEnd, convert, updateOnDrag, isOrthographic, threePos],
  );
  return (
    <>
      <MB.Camera
        proxy
        position={threePos}
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
