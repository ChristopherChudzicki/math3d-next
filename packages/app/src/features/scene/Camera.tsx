import React, { useCallback } from "react";
import * as MB from "mathbox-react";
import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { useMathItemResults } from "../sceneControls/mathItems/mathScope";
import { useMathScope } from "../sceneControls/mathItems/mathItemsSlice/index";
import type { AxesRange, Coords } from "./graphics/interfaces";
import { project } from "./graphics/util";

const { Controls } = MB.Threestrap;

const props = [
  "isRotateEnabled",
  "isZoomEnabled",
  "isPanEnabled",
  "position",
  "target",
  "updateOnDrag",
  "useRelative",
] as const;

const THREEJS_RANGE: AxesRange = [
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

type CameraProps = {
  item: MathItem<MathItemType.Camera>;
  range: AxesRange;
  onMoveEnd?: OnMoveEnd;
};
const Camera: React.FC<CameraProps> = ({ item, range, onMoveEnd }) => {
  invariant(range !== undefined, "Camera must have a range");
  const scope = useMathScope();
  const {
    isRotateEnabled,
    isZoomEnabled,
    isPanEnabled,
    position,
    updateOnDrag,
    useRelative,
  } = useMathItemResults(scope, item, props);

  const fromUiCoords = useCallback(
    (coords: Coords) => {
      if (useRelative) return coords;
      return project(coords, range, THREEJS_RANGE);
    },
    [range, useRelative]
  );
  const toUiCoords = useCallback(
    (coords: Coords) => {
      if (useRelative) return coords;
      return project(coords, THREEJS_RANGE, range);
    },
    [range, useRelative]
  );

  const threePos = position ? fromUiCoords(position) : undefined;
  const onEnd: OnControlsChangeEnd = useCallback(
    (e) => {
      if (!updateOnDrag) return;
      const cameraPosition = e.target.object.position.toArray();
      const target = e.target.target.toArray();
      onMoveEnd?.({
        position: toUiCoords(cameraPosition),
        target: toUiCoords(target),
      });
    },
    [onMoveEnd, toUiCoords, updateOnDrag]
  );
  return (
    <>
      <MB.Camera proxy position={threePos} />
      <Controls
        type="orbit"
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
