import { OrthographicCamera, PerspectiveCamera } from "three/webgpu";
import type { ViewportSpec } from "@math3d/viewport-spec";

/** Vertical field of view, in degrees, as MathBox and Use.GPU draw it. */
export const FOV = 60;
const NEAR = 0.01;
const FAR = 1000;

type CameraInput = Pick<ViewportSpec, "camera" | "orthographic">;

/**
 * The spec's camera at the given aspect ratio, z up. An orthographic camera
 * shows the same extent at the target as the perspective one would.
 */
export const makeCamera = (
  { camera, orthographic }: CameraInput,
  aspect: number,
): PerspectiveCamera | OrthographicCamera => {
  const [px, py, pz] = camera.position;
  const [tx, ty, tz] = camera.target;
  let result: PerspectiveCamera | OrthographicCamera;
  if (orthographic) {
    const distance = Math.hypot(px - tx, py - ty, pz - tz);
    const halfHeight = distance * Math.tan(((FOV / 2) * Math.PI) / 180);
    const halfWidth = halfHeight * aspect;
    result = new OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      NEAR,
      FAR,
    );
  } else {
    result = new PerspectiveCamera(FOV, aspect, NEAR, FAR);
  }
  result.up.set(0, 0, 1);
  result.position.set(px, py, pz);
  result.lookAt(tx, ty, tz);
  result.updateMatrixWorld();
  return result;
};
