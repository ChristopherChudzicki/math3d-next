import { expect, test, vi } from "vitest";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three/webgpu";
import type { CameraSpec, Coords } from "@math3d/viewport-spec";
import { ViewCamera } from "./camera";

const camera: CameraSpec = { position: [0, -4, 3], target: [0, 0, 0] };
const controls = { rotate: true, pan: true, zoom: true };

const setup = (orthographic: boolean) => {
  const onMove = vi.fn();
  const view = new ViewCamera(null, onMove);
  const spec = { camera, cameraRevision: 0, orthographic, controls };
  view.setAspect(2);
  view.setSpec(spec);
  /** Where the view's camera puts `point` on screen, in [-1, 1]³. */
  const project = (point: Coords) => {
    view.camera.updateMatrixWorld();
    return new Vector3(...point).project(view.camera);
  };
  return { view, onMove, spec, project };
};

const distance = ({ position, target }: CameraSpec) =>
  new Vector3(...position).distanceTo(new Vector3(...target));

/** `coords`, as an asymmetric matcher allowing the controls' round-off. */
const near = (coords: Coords) => coords.map((x) => expect.closeTo(x, 9));
const nearCamera = ({ position, target }: CameraSpec) => ({
  position: near(position),
  target: near(target),
});

test("looks from position at target, z up", () => {
  const { view, project } = setup(false);

  expect(view.camera).toBeInstanceOf(PerspectiveCamera);
  expect(view.camera.position.toArray()).toEqual(near(camera.position));
  const target = project(camera.target);
  expect(target.x).toBeCloseTo(0);
  expect(target.y).toBeCloseTo(0);
  // Up in the world is up on screen.
  expect(project([0, 0, 1]).y).toBeGreaterThan(0);
});

test("an orthographic camera spans what the perspective one shows at the target", () => {
  const perspective = setup(false);
  const orthographic = setup(true);
  expect(orthographic.view.camera).toBeInstanceOf(OrthographicCamera);
  const { left, right, top } = orthographic.view.camera as OrthographicCamera;
  expect([left, right]).toEqual([-2 * top, 2 * top]);

  // The top edge of the perspective view, in the plane through the target:
  // the target is 5 away, and the edge ray is 30° off the view axis.
  const { camera: lens } = perspective.view;
  lens.updateMatrixWorld();
  const edge = new Vector3(0, 1, 0)
    .unproject(lens)
    .sub(lens.position)
    .normalize()
    .multiplyScalar(5 / Math.cos(Math.PI / 6))
    .add(lens.position);

  expect(orthographic.project(edge.toArray()).y).toBeCloseTo(1);
});

test("an orthographic camera clips nothing behind its position", () => {
  const { project } = setup(true);
  // 10 behind the camera, on its line of sight.
  const behind = project([0, -12, 9]);
  expect(Math.abs(behind.z)).toBeLessThan(1);
});

test.each([false, true])(
  "draws what lies thousands of units away, as MathBox does (orthographic: %s)",
  (orthographic) => {
    const { view, spec, project } = setup(orthographic);
    view.setSpec({
      ...spec,
      camera: { position: [0, -2000, 1500], target: [0, 0, 0] },
      cameraRevision: 1,
    });
    // 4,000 from the camera, 1,500 beyond its target.
    expect(Math.abs(project([0, 1200, -900]).z)).toBeLessThan(1);
  },
);

test("an orthographic camera at its target still has a view", () => {
  const { view, spec } = setup(true);
  view.setSpec({
    ...spec,
    camera: { position: [1, 1, 1], target: [1, 1, 1] },
    cameraRevision: 1,
  });
  expect((view.camera as OrthographicCamera).top).toBeGreaterThan(0);
});

test("a resize keeps the orthographic view's height", () => {
  const { view } = setup(true);
  const { top } = view.camera as OrthographicCamera;
  view.setAspect(1);
  expect(view.camera).toMatchObject({ top, left: -top, right: top });
});

test("reports an orthographic zoom as distance along the view direction", () => {
  const { view, onMove } = setup(true);
  view.controls.dollyOut(2);
  const { zoom } = view.camera;
  expect(zoom).not.toBe(1);

  const reported: CameraSpec = onMove.mock.lastCall?.[0];
  expect(distance(reported)).toBeCloseTo(5 / zoom);
  const direction = new Vector3(...reported.position).normalize();
  expect(direction.toArray()).toEqual(near([0, -4 / 5, 3 / 5]));
});

test("reports the user's moves but not its own", () => {
  const { view, onMove, spec } = setup(false);
  view.setSpec({ ...spec, cameraRevision: 1 });
  expect(onMove).not.toHaveBeenCalled();
  view.controls.rotateLeft(0.5);
  expect(onMove).toHaveBeenCalledOnce();
});

test.each([false, true])(
  "a new revision moves the view back to the camera (orthographic %s)",
  (orthographic) => {
    const { view, spec } = setup(orthographic);
    view.controls.rotateLeft(0.5);
    view.controls.dollyOut(2);
    view.controls.target.set(1, 1, 1);
    view.controls.update();

    // A new camera object alone leaves the view.
    view.setSpec({ ...spec, camera: { ...camera } });
    expect(view.current()).not.toEqual(nearCamera(camera));
    view.setSpec({ ...spec, cameraRevision: 1 });
    expect(view.current()).toEqual(nearCamera(camera));
    expect(view.camera.zoom).toBe(1);
  },
);

test.each([false, true])(
  "switching projection keeps the view (orthographic %s first)",
  (orthographic) => {
    const { view, spec } = setup(orthographic);
    view.controls.rotateLeft(0.5);
    view.controls.dollyOut(2);
    const before = view.current();

    view.setSpec({ ...spec, orthographic: !orthographic });
    expect(view.camera).toBeInstanceOf(
      orthographic ? PerspectiveCamera : OrthographicCamera,
    );
    expect(view.current()).toEqual(nearCamera(before));
  },
);

test("the controls wait for the first spec", () => {
  const view = new ViewCamera(null, vi.fn());
  expect(view.controls.enabled).toBe(false);
  view.setSpec({ camera, cameraRevision: 0, orthographic: false, controls });
  expect(view.controls.enabled).toBe(true);
});

test("a wheel event zooms by 0.95 whatever its deltaY, as MathBox does", () => {
  const distanceAfterWheel = (deltaY: number) => {
    const { view } = setup(false);
    const wheel = view.controls as unknown as {
      _handleMouseWheel(
        event: Pick<WheelEvent, "deltaY" | "clientX" | "clientY">,
      ): void;
    };
    wheel._handleMouseWheel({ deltaY, clientX: 0, clientY: 0 });
    return distance(view.current());
  };
  expect(distanceAfterWheel(3)).toBeCloseTo(5 / 0.95);
  expect(distanceAfterWheel(300)).toBeCloseTo(5 / 0.95);
});

test("passes the enabled controls on", () => {
  const { view, spec } = setup(false);
  view.setSpec({
    ...spec,
    controls: { rotate: false, pan: true, zoom: false },
  });
  expect(view.controls).toMatchObject({
    enableRotate: false,
    enablePan: true,
    enableZoom: false,
  });
});
