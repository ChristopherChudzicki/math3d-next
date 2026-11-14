import {
  Color,
  ColorManagement,
  Group,
  LinearSRGBColorSpace,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import type { CameraSpec, ViewportSpec } from "@math3d/viewport-spec";
import { ViewCamera } from "./camera";
import { mathToView } from "./viewTransform";
import { inDrawOrder } from "./drawOrder";
import { builders } from "./graphics/builders";
import { syncGraphics } from "./graphics/syncGraphics";
import type { DrawnGraphics } from "./graphics/syncGraphics";
import { onLabelRelayout } from "./label/atlas";
import type { Shading } from "./mesh/meshMaterial";
import { OitFrame } from "./OitFrame";
import { BACKGROUND } from "./shader/background";
import type { Transparency } from "./shader/material";
import { Settle } from "./settle";

// Colors stay the sRGB values the spec gives (see `outputColorSpace` below),
// so three must not convert a `Color` to linear on its way in either.
ColorManagement.enabled = false;

let orderedReported = false;

/** Says once per page why `oit` gave way to `ordered`: no picture shows it. */
const reportOrdered = (obstacle: string) => {
  if (orderedReported) return;
  orderedReported = true;
  // eslint-disable-next-line no-console
  console.info(
    `three.js renderer: translucent items draw in order, not order-independently (${obstacle}).`,
  );
};

type Options = {
  /** Use the WebGL2 backend even where WebGPU is available. */
  forceWebGL: boolean;
  /** How translucent marks combine; `oit` when absent, where the browser can. */
  transparency?: Transparency;
  /**
   * Called once: after the `ResizeObserver` has reported, the first drawn
   * frame with no redraw pending.
   */
  onSettled(): void;
  /** Called once, after the first draw. */
  onDrawn(): void;
  /** The camera as the user moves it. */
  onCameraMove(camera: CameraSpec): void;
  /** Gets what a resize or a frame throws, since neither runs inside React. */
  onError(error: unknown): void;
  /** How shaded surfaces are lit; `glossy` when absent. */
  shading?: Shading;
};

/**
 * A `WebGPURenderer` drawing a `ViewportSpec` into its own canvas, which it
 * sizes to `host`. It draws a frame only when something changes, though
 * three's own animation-frame loop runs from the first frame until disposal.
 */
export class ThreeScene {
  // A canvas keeps the first context type it hands out, so one that served
  // WebGPU can't back WebGL2: each instance gets its own.
  private readonly canvas = document.createElement("canvas");

  /** Holds the graphics; its transform applies the axes' range and scale. */
  private readonly world = new Group();

  private readonly graphics: DrawnGraphics = new Map();

  private readonly scene = new Scene();

  private readonly renderer: WebGPURenderer;

  private readonly resizeObserver: ResizeObserver;

  private readonly view: ViewCamera;

  // A new devicePixelRatio relays out the labels without resizing the host.
  // Only then resize: it clears the drawing buffer and reallocates its targets.
  private readonly stopLabelRelayout = onLabelRelayout(() =>
    this.reporting(() => {
      if (window.devicePixelRatio === this.renderer.getPixelRatio()) {
        this.invalidate();
      } else {
        this.resize();
      }
    }),
  );

  private spec: ViewportSpec | null = null;

  /** The spec the scene's objects were last built from. */
  private built: ViewportSpec | null = null;

  /** Null until the backend is known. */
  private transparency: Transparency | null = null;

  private readonly shading: Shading;

  private oit: OitFrame | null = null;

  private frame: number | null = null;

  private readonly settle = new Settle(
    () => this.frame !== null,
    () => this.options.onSettled(),
  );

  private disposed = false;

  private drawn = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: Options,
  ) {
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.shading = options.shading ?? "glossy";
    // E2E reads it.
    this.canvas.dataset.shading = this.shading;
    host.appendChild(this.canvas);
    this.view = new ViewCamera(this.canvas, (camera) => {
      options.onCameraMove(camera);
      this.invalidate();
    });
    this.scene.add(this.world);
    this.renderer = new WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      forceWebGL: options.forceWebGL,
    });
    // three's default sorts equal `renderOrder`s by distance, which reorders
    // blended marks as the camera moves.
    this.renderer.setOpaqueSort(inDrawOrder);
    this.renderer.setTransparentSort(inDrawOrder);
    // Colors go to the canvas as given and blend there in sRGB, as MathBox's
    // do; three's default blends in linear space, which lightens translucency.
    this.renderer.outputColorSpace = LinearSRGBColorSpace;
    this.renderer.setClearColor(new Color(...BACKGROUND), 1);
    this.resizeObserver = new ResizeObserver(() =>
      this.reporting(() => {
        this.settle.resized();
        this.resize();
      }),
    );
  }

  /** Resolves once a backend is up; rejects when neither WebGPU nor WebGL2 is. */
  async init(): Promise<void> {
    await this.renderer.init();
    if (this.disposed) return;
    // E2E reads it.
    const backend =
      "isWebGPUBackend" in this.renderer.backend ? "webgpu" : "webgl2";
    this.canvas.dataset.backend = backend;
    this.transparency = this.options.transparency ?? "oit";
    const obstacle =
      this.transparency === "oit" ? OitFrame.obstacle(this.renderer) : null;
    if (obstacle) {
      this.transparency = "ordered";
      reportOrdered(obstacle);
    }
    this.canvas.dataset.transparency = this.transparency;
    if (this.transparency === "oit") {
      this.oit = new OitFrame(this.renderer, this.scene);
    }
    this.build();
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  setSpec(spec: ViewportSpec): void {
    this.spec = spec;
    this.build();
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.settle.dispose();
    this.resizeObserver.disconnect();
    this.stopLabelRelayout();
    this.view.dispose();
    this.canvas.remove();
    this.graphics.forEach(({ graphic }) => graphic.dispose());
    this.oit?.dispose();
    // dispose() awaits init(), so it rejects whenever init did; init()'s
    // caller owns that failure.
    this.renderer.dispose().catch(() => {});
  }

  /** Brings the scene's objects up to `spec`, once the model is known. */
  private build(): void {
    const { spec, built: last, transparency } = this;
    if (!spec || !transparency) return;
    this.built = spec;
    if (last?.range !== spec.range || last?.scale !== spec.scale) {
      const { scale, offset } = mathToView(spec.range, spec.scale);
      this.world.scale.set(...scale);
      this.world.position.set(...offset);
      // Half the diagonal of the axes' box, which holds most of any scene.
      this.oit?.setRadius(Math.hypot(...spec.scale));
    }
    this.view.setSpec(spec);
    if (last?.graphics !== spec.graphics) {
      syncGraphics(
        this.world,
        this.graphics,
        spec.graphics,
        builders,
        transparency,
        this.shading,
      );
    }
    this.invalidate();
  }

  private hasSize(): boolean {
    return this.host.clientWidth > 0 && this.host.clientHeight > 0;
  }

  private resize(): void {
    if (!this.hasSize()) return;
    // Browser zoom changes it.
    this.renderer.setPixelRatio(window.devicePixelRatio);
    const { clientWidth, clientHeight } = this.host;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.view.setAspect(clientWidth / clientHeight);
    this.invalidate();
  }

  private invalidate(): void {
    if (this.frame !== null || this.disposed) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.reporting(() => this.draw());
    });
  }

  private reporting(callback: () => void): void {
    try {
      callback();
    } catch (error) {
      this.options.onError(error);
    }
  }

  private draw(): void {
    // Before init resolves or the first spec, or while the host has no size.
    if (!this.built || !this.hasSize()) return;
    if (this.oit) this.oit.render(this.view.camera);
    else this.renderer.render(this.scene, this.view.camera);
    if (!this.drawn) {
      this.drawn = true;
      this.options.onDrawn();
    }
    this.settle.drawn();
  }
}
