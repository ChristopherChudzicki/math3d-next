import type { Coords } from "./coordinates";
import sameCoordinates from "./sameCoordinates";

type CameraPatch = { path: "/position" | "/target"; value: string };

const format = (coords: readonly number[]) =>
  `[${coords.map((x) => x.toPrecision(6))}]`;

/**
 * The camera item edits that store a camera move, or `null` when the camera
 * went nowhere (a click on the scene ends a "move" too; it isn't an edit).
 */
const cameraPatches = (
  prev: { position: readonly number[] | undefined; target: readonly number[] },
  next: { position: Coords; target: Coords },
): CameraPatch[] | null => {
  const moved =
    !prev.position ||
    !sameCoordinates(next.position, prev.position) ||
    !sameCoordinates(next.target, prev.target);
  if (!moved) return null;
  return [
    { path: "/position", value: format(next.position) },
    { path: "/target", value: format(next.target) },
  ];
};

export { cameraPatches };
export type { CameraPatch };
