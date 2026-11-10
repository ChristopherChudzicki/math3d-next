import { OrthographicCamera, PerspectiveCamera } from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CameraSpec, ViewportSpec } from "@math3d/viewport-spec";

/** Vertical field of view, in degrees, as MathBox and Use.GPU draw it. */
export const FOV = 60;
const TAN_HALF_FOV = Math.tan(((FOV / 2) * Math.PI) / 180);
const NEAR = 0.01;
const FAR = 1000;

type CameraInput = Pick<
  ViewportSpec,
  "camera" | "cameraRevision" | "orthographic" | "controls"
>;

/**
 * Half the visible height at the target, per `ViewportSpec.orthographic`.
 * A camera at its target gets distance 1, as in Use.GPU, not an empty view.
 */
const orthographicHalfHeight = ({ position, target }: CameraSpec) =>
  (Math.hypot(
    position[0] - target[0],
    position[1] - target[1],
    position[2] - target[2],
  ) || 1) * TAN_HALF_FOV;

const zUp = <C extends PerspectiveCamera | OrthographicCamera>(
  camera: C,
): C => {
  // OrbitControls orbits around `up`, read when the controls are built.
  camera.up.set(0, 0, 1);
  return camera;
};

/**
 * The viewport's camera, z up, moved by `OrbitControls` on `domElement`
 * (none in tests). `onMove` gets each move the controls make, as a
 * `CameraSpec`; a move `setSpec` makes is not reported.
 */
export class ViewCamera {
  private readonly perspective = zUp(new PerspectiveCamera(FOV, 1, NEAR, FAR));

  // near = -FAR: nothing behind the camera is clipped; see
  // `ViewportSpec.orthographic`.
  private readonly orthographic = zUp(
    new OrthographicCamera(-1, 1, 1, -1, -FAR, FAR),
  );

  /** Public so specs can drive the controls without a DOM. */
  readonly controls: OrbitControls;

  /** The orthographic view's half height at zoom 1. */
  private halfHeight = 1;

  private aspect = 1;

  private revision: number | null = null;

  private placing = false;

  constructor(
    domElement: HTMLElement | null,
    onMove: (camera: CameraSpec) => void,
  ) {
    this.controls = new OrbitControls(this.perspective, domElement);
    // Until the first spec places the camera.
    this.controls.enabled = false;
    this.controls.addEventListener("change", () => {
      if (!this.placing) onMove(this.current());
    });
    // MathBox's cursor whenever it has controls.
    domElement?.style.setProperty("cursor", "move");
  }

  get camera(): PerspectiveCamera | OrthographicCamera {
    return this.controls.object as PerspectiveCamera | OrthographicCamera;
  }

  /** The current view, with an orthographic zoom folded into distance. */
  current(): CameraSpec {
    const { camera } = this;
    const { target } = this.controls;
    const offset = camera.position.clone().sub(target);
    if (camera instanceof OrthographicCamera) offset.divideScalar(camera.zoom);
    return {
      position: offset.add(target).toArray(),
      target: target.toArray(),
    };
  }

  setSpec({ camera, cameraRevision, orthographic, controls }: CameraInput) {
    this.controls.enabled = true;
    this.controls.enableRotate = controls.rotate;
    this.controls.enablePan = controls.pan;
    this.controls.enableZoom = controls.zoom;
    const reset = cameraRevision !== this.revision;
    this.revision = cameraRevision;
    if (orthographic !== this.camera instanceof OrthographicCamera) {
      // Carries the current view over to the other projection.
      const current = this.current();
      this.controls.object = orthographic
        ? this.orthographic
        : this.perspective;
      if (!reset) this.moveTo(current);
    }
    if (reset) this.moveTo(camera);
  }

  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.updateProjection();
  }

  dispose(): void {
    this.controls.dispose();
  }

  private moveTo({ position, target }: CameraSpec): void {
    const { camera } = this;
    this.controls.target.set(...target);
    camera.position.set(...position);
    if (camera instanceof OrthographicCamera) {
      camera.zoom = 1;
      this.halfHeight = orthographicHalfHeight({ position, target });
    }
    this.updateProjection();
    // `update()` may fire `change`; `placing` keeps it unreported.
    this.placing = true;
    this.controls.update();
    this.placing = false;
  }

  private updateProjection(): void {
    const { camera, aspect, halfHeight } = this;
    if (camera instanceof OrthographicCamera) {
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
    } else {
      camera.aspect = aspect;
    }
    camera.updateProjectionMatrix();
  }
}
