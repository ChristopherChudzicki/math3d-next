import { NodeUpdateType, RenderPipeline } from "three/webgpu";
import type { Camera, Scene, WebGPURenderer } from "three/webgpu";
import { oitPass } from "three/addons/tsl/display/OITPassNode.js";
import { cameraViewMatrix, clamp, exp, output, uniform, vec4 } from "three/tsl";
import { unbiasedViewZ } from "./shader/depthStyle";

/**
 * How fast a translucent fragment's share of the blended color falls with
 * depth: e^NEARNESS_GAIN per scene radius. At 0 every layer counts alike and
 * nothing says which is in front; much higher and a far layer's color is lost
 * behind any near one.
 */
const NEARNESS_GAIN = 4;

/**
 * Draws a scene through three's weighted, blended OIT pass: `transparent` +
 * `NormalBlending` materials accumulate, depth-tested against the rest, and
 * composite over it on unconverted sRGB values.
 */
export class OitFrame {
  private readonly pass: ReturnType<typeof oitPass>;

  private readonly pipeline: RenderPipeline;

  /** The scene's radius around the origin, in view units. */
  private readonly radius = uniform(1);

  private allocated = false;

  constructor(renderer: WebGPURenderer, scene: Scene, camera: Camera) {
    this.pass = oitPass(scene, camera);
    // Relative to the scene, so the same at any zoom and projection; three's
    // default, on absolute depth, is nearly flat here.
    const origin = cameraViewMatrix.mul(vec4(0, 0, 0, 1)).z;
    const nearness = clamp(
      unbiasedViewZ.sub(origin).div(this.radius),
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
    // three 0.187 clears depth on a target's first render, and the
    // accumulation target shares the scene's: that frame tests no depth.
    // Drawn again, it does.
    this.pipeline.render();
  }

  dispose(): void {
    this.pipeline.dispose();
    this.pass.dispose();
  }
}
