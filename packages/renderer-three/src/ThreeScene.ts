import {
  Group,
  LinearSRGBColorSpace,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import type { CameraSpec, ViewportSpec } from "@math3d/viewport-spec";
import { ViewCamera } from "./camera";
import { mathToView } from "./viewTransform";
import { builders } from "./graphics/builders";
import { syncGraphics } from "./graphics/syncGraphics";
import type { DrawnGraphics } from "./graphics/syncGraphics";

type Options = {
  /** Use the WebGL2 backend even where WebGPU is available. */
  forceWebGL: boolean;
  /** Called once, after the first frame is drawn. */
  onFirstFrame(): void;
  /** The camera as the user moves it. */
  onCameraMove(camera: CameraSpec): void;
  /** Gets what a resize or a frame throws, since neither runs inside React. */
  onError(error: unknown): void;
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

  private spec: ViewportSpec | null = null;

  private frame: number | null = null;

  private drawn = false;

  private disposed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: Options,
  ) {
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
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
    // Colors go to the canvas as given and blend there in sRGB, as MathBox's
    // do; three's default blends in linear space, which lightens translucency.
    this.renderer.outputColorSpace = LinearSRGBColorSpace;
    this.renderer.setClearColor(0xffffff, 1);
    this.resizeObserver = new ResizeObserver(() =>
      this.reporting(() => this.resize()),
    );
  }

  /** Resolves once a backend is up; rejects when neither WebGPU nor WebGL2 is. */
  async init(): Promise<void> {
    await this.renderer.init();
    if (this.disposed) return;
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  setSpec(spec: ViewportSpec): void {
    const last = this.spec;
    this.spec = spec;
    if (last?.range !== spec.range || last?.scale !== spec.scale) {
      const { scale, offset } = mathToView(spec.range, spec.scale);
      this.world.scale.set(...scale);
      this.world.position.set(...offset);
    }
    this.view.setSpec(spec);
    if (last?.graphics !== spec.graphics) {
      syncGraphics(this.world, this.graphics, spec.graphics, builders);
    }
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.view.dispose();
    this.canvas.remove();
    this.graphics.forEach(({ graphic }) => graphic.dispose());
    // dispose() awaits init(), so it rejects whenever init did; init()'s
    // caller owns that failure.
    this.renderer.dispose().catch(() => {});
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
    if (!this.renderer.initialized || !this.spec || !this.hasSize()) return;
    this.renderer.render(this.scene, this.view.camera);
    if (!this.drawn) {
      this.drawn = true;
      this.options.onFirstFrame();
    }
  }
}
