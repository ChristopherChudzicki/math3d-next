import { NodeUpdateType, RenderPipeline } from "three/webgpu";
import type { Camera, Scene, WebGPURenderer } from "three/webgpu";
import { oitPass } from "three/addons/tsl/display/OITPassNode.js";
import {
  cameraViewMatrix,
  clamp,
  exp,
  output,
  positionView,
  uniform,
  vec4,
} from "three/tsl";

/**
 * How fast a translucent fragment's share of the blended color falls with
 * depth: e^NEARNESS_GAIN per scene radius. At 0 every layer counts alike and
 * nothing says which is in front; much higher and a far layer's color is lost
 * behind any near one.
 */
const NEARNESS_GAIN = 4;

/**
 * Draws a scene with order-independent transparency: three's weighted,
 * blended OIT pass. Opaque materials, and blended ones without three's
 * `NormalBlending`, draw as usual into one target; the rest accumulate in a
 * second, depth-tested against the first, and are composited over it.
 *
 * Nothing converts colors on the way, so the blend is on sRGB values.
 */
export class OitFrame {
  private readonly pass: ReturnType<typeof oitPass>;

  private readonly pipeline: RenderPipeline;

  /** The scene's radius around the origin, in view units. */
  private readonly radius = uniform(1);

  private allocated = false;

  constructor(renderer: WebGPURenderer, scene: Scene, camera: Camera) {
    this.pass = oitPass(scene, camera);
    // three's default weight is a function of absolute view depth, nearly flat
    // at this scene's scale. This one is relative to the scene, so the same at
    // any zoom and in either projection.
    const origin = cameraViewMatrix.mul(vec4(0, 0, 0, 1)).z;
    const nearness = clamp(
      positionView.z.sub(origin).div(this.radius),
      -1.5,
      1.5,
    );
    this.pass.weightNode = output.a.mul(exp(nearness.mul(NEARNESS_GAIN)));
    // Once per render, not three's once per animation frame: `render` may
    // draw twice in one.
    this.pass.updateBeforeType = NodeUpdateType.RENDER;
    this.pipeline = new RenderPipeline(renderer);
    this.pipeline.outputNode = this.pass;
  }

  /** The distance from the view's origin that holds the scene's graphics. */
  setRadius(radius: number): void {
    this.radius.value = radius;
  }

  /** Call when the drawing buffer's size changes. */
  resized(): void {
    this.allocated = false;
  }

  render(camera: Camera): void {
    this.pass.camera = camera;
    this.pipeline.render();
    if (this.allocated) return;
    this.allocated = true;
    // In three 0.187 the first frame into newly sized targets loses the depth
    // the accumulation target shares with the scene's, on both backends (the
    // WebGL one clears it as it creates the framebuffer): every translucent
    // fragment passes the depth test. The same frame drawn again is right.
    this.pipeline.render();
  }

  dispose(): void {
    this.pipeline.dispose();
    this.pass.dispose();
  }
}
