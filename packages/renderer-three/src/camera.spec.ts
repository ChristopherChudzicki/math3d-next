import { expect, test } from "vitest";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three/webgpu";
import type { CameraSpec } from "@math3d/viewport-spec";
import { makeCamera } from "./camera";

const camera: CameraSpec = { position: [0, -4, 3], target: [0, 0, 0] };

test("looks from position at target, z up", () => {
  const result = makeCamera({ camera, orthographic: false }, 2);

  expect(result).toBeInstanceOf(PerspectiveCamera);
  expect(result.position.toArray()).toEqual(camera.position);
  // The target projects to the center of the view.
  const target = new Vector3(...camera.target).project(result);
  expect(target.x).toBeCloseTo(0);
  expect(target.y).toBeCloseTo(0);
  // Up in the world is up on screen.
  const above = new Vector3(0, 0, 1).project(result);
  expect(above.y).toBeGreaterThan(0);
});

test("an orthographic camera spans what the perspective one shows at the target", () => {
  const perspective = makeCamera({ camera, orthographic: false }, 2);
  const orthographic = makeCamera({ camera, orthographic: true }, 2);
  expect(orthographic).toBeInstanceOf(OrthographicCamera);
  const { left, right, top } = orthographic as OrthographicCamera;
  expect([left, right]).toEqual([-2 * top, 2 * top]);

  // The top edge of the perspective view, in the plane through the target:
  // the target is 5 away, and the edge ray is 30° off the view axis.
  const edge = new Vector3(0, 1, 0)
    .unproject(perspective)
    .sub(perspective.position)
    .normalize()
    .multiplyScalar(5 / Math.cos(Math.PI / 6))
    .add(perspective.position);

  expect(edge.clone().project(orthographic).y).toBeCloseTo(1);
});
