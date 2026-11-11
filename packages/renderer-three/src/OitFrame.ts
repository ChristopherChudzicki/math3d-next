import {
  BlendMode,
  CustomBlending,
  HalfFloatType,
  NodeMaterial,
  OneFactor,
  OneMinusSrcColorFactor,
  QuadMesh,
  RedFormat,
  RenderTarget,
  Vector2,
} from "three/webgpu";
import type { Camera, Node, Scene, WebGPURenderer } from "three/webgpu";
import {
  Fn,
  cameraViewMatrix,
  clamp,
  exp,
  float,
  mix,
  mrt,
  output,
  texture,
  uniform,
  vec4,
} from "three/tsl";
import { accumulatingLast } from "./drawOrder";
import { unbiasedViewZ } from "./shader/depthStyle";
import { accumulates } from "./shader/material";

/**
 * How fast a translucent fragment's share of the blended color falls with
 * depth: e^NEARNESS_GAIN per scene radius. At 0 every layer counts alike and
 * nothing says which is in front; much higher and a far layer's color is lost
 * behind any near one.
 */
const NEARNESS_GAIN = 4;

/**
 * `accumulating` in the shader of a material that accumulates, `rest` in any
 * other. three builds a pass's outputs into each material's shader, handing
 * a `Fn` with no inputs the builder.
 */
const byMaterial = <T extends "float" | "vec4">(
  accumulating: Node<T>,
  rest: Node<T>,
): Node<T> =>
  // three types the call's result conditionally on the callback's, which
  // TypeScript can't resolve for a generic `T`.
  Fn((builder) =>
    accumulates(builder.material) ? accumulating : rest,
  )() as Node<T>;

const added = new BlendMode(CustomBlending);
added.blendSrc = OneFactor;
added.blendDst = OneFactor;

// a + dst (1 - a): the share of a pixel that accumulating fragments cover.
const covered = new BlendMode(CustomBlending);
covered.blendSrc = OneFactor;
covered.blendDst = OneMinusSrcColorFactor;

/**
 * Draws a scene with weighted, blended order-independent transparency
 * (McGuire and Bavoil) in one multisampled render target.
 *
 * It stands in for three's `OITPassNode` addon until that one antialiases on
 * WebGL2. The addon's two render targets share a depth texture, which WebGL2
 * can't multisample, so thin gridlines break into dots there. ADR-0009 has
 * the reasoning and the way back to the addon.
 *
 * One draw writes three attachments. A mark that accumulates (see
 * `accumulates`) writes its weighted color to `sum` and its alpha to
 * `coverage`; any other writes its color to `output`. Each writes zeros to
 * the attachments that aren't its own, which changes nothing there.
 * Accumulating marks draw last (`accumulatingLast`), so they test against
 * the others' depth. The colors composite unconverted, as sRGB values.
 */
export class OitFrame {
  private readonly target: RenderTarget;

  private readonly outputs: ReturnType<typeof mrt>;

  private readonly compositeMaterial = new NodeMaterial();

  private readonly composite = new QuadMesh(this.compositeMaterial);

  /** The scene's radius around the origin, in view units. */
  private readonly radius = uniform(1);

  private readonly size = new Vector2();

  /**
   * Whether the pass can draw on the renderer's backend, once that is up. It
   * needs each attachment blended its own way and a multisampled half-float
   * one; without the first, translucent marks vanish.
   */
  static supported(renderer: WebGPURenderer): boolean {
    const { backend } = renderer;
    if ("isWebGPUBackend" in backend) {
      // Untyped. three sets it for a device in WebGPU's compatibility mode,
      // where it blends every attachment as the material does.
      return !("compatibilityMode" in backend && backend.compatibilityMode);
    }
    // The context three made: a canvas hands out one per type.
    const gl = renderer.domElement.getContext("webgl2");
    if (!gl) return false;
    return (
      gl.getExtension("OES_draw_buffers_indexed") !== null &&
      gl.getExtension("EXT_color_buffer_float") !== null &&
      // With it three attaches multisampled textures, a path this target's
      // three attachments are untested on.
      gl.getExtension("WEBGL_multisampled_render_to_texture") === null
    );
  }

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly scene: Scene,
  ) {
    this.target = new RenderTarget(1, 1, {
      count: 3,
      samples: renderer.samples,
      // Nothing reads depth after the draw.
      resolveDepthBuffer: false,
    });
    const [color, sum, coverage] = this.target.textures;
    color.name = "output";
    sum.name = "sum";
    sum.type = HalfFloatType;
    coverage.name = "coverage";
    coverage.format = RedFormat;

    // Relative to the scene, so the same at any zoom and projection.
    const origin = cameraViewMatrix.mul(vec4(0, 0, 0, 1)).z;
    const nearness = clamp(
      unbiasedViewZ.sub(origin).div(this.radius),
      -1.5,
      1.5,
    );
    const alpha = output.a;
    const weight = alpha.mul(exp(nearness.mul(NEARNESS_GAIN)));
    this.outputs = mrt({
      // Zero alpha under the material's own blend leaves the color as it is.
      output: byMaterial(vec4(0), output),
      sum: byMaterial(vec4(output.rgb.mul(alpha), alpha).mul(weight), vec4(0)),
      // Zero is the clear value, and three's WebGL2 backend writes an opaque
      // mark's zero unblended, before any mark accumulates. three's
      // revealage clears to one.
      coverage: byMaterial(alpha, float(0)),
    })
      .setBlendMode("sum", added)
      .setBlendMode("coverage", covered)
      .setClearColor("sum", 0x000000, 0)
      .setClearColor("coverage", 0x000000, 0);

    const opaque = texture(color);
    const blended = texture(sum);
    this.compositeMaterial.fragmentNode = vec4(
      mix(
        opaque.rgb,
        blended.rgb.div(blended.a.max(1e-5)),
        texture(coverage).r,
      ),
      opaque.a,
    );
    this.compositeMaterial.depthTest = false;
    this.compositeMaterial.depthWrite = false;

    renderer.setTransparentSort(accumulatingLast);
  }

  setRadius(radius: number): void {
    this.radius.value = radius;
  }

  render(camera: Camera): void {
    const { renderer, target } = this;
    renderer.getDrawingBufferSize(this.size);
    target.setSize(this.size.x, this.size.y);
    renderer.setRenderTarget(target);
    renderer.setMRT(this.outputs);
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
    renderer.setMRT(null);
    this.composite.render(renderer);
  }

  dispose(): void {
    this.target.dispose();
    this.compositeMaterial.dispose();
  }
}
