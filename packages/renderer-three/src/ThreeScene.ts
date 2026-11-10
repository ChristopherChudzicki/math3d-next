import { Group, Scene, WebGPURenderer } from "three/webgpu";
import type { Camera } from "three/webgpu";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { makeCamera } from "./camera";
import { mathToView } from "./viewTransform";
import { builders } from "./graphics/builders";
import { syncGraphics } from "./graphics/syncGraphics";
import type { DrawnGraphics } from "./graphics/syncGraphics";

type Options = {
  /** Use the WebGL2 backend even where WebGPU is available. */
  forceWebGL: boolean;
  /** Called once, after the first frame is drawn. */
  onFirstFrame(): void;
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

  private spec: ViewportSpec | null = null;

  private camera: Camera | null = null;

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
    this.scene.add(this.world);
    this.renderer = new WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      forceWebGL: options.forceWebGL,
    });
    this.renderer.setClearColor(0xffffff, 1);
    this.resizeObserver = new ResizeObserver(() => this.resize());
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
    if (
      last?.camera !== spec.camera ||
      last?.orthographic !== spec.orthographic
    ) {
      this.updateCamera();
    }
    if (last?.graphics !== spec.graphics) {
      syncGraphics(this.world, this.graphics, spec.graphics, builders);
    }
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
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
    // Browser zoom and moving between screens change it.
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
    this.updateCamera();
    this.invalidate();
  }

  private updateCamera(): void {
    if (!this.spec || !this.hasSize()) return;
    const { clientWidth, clientHeight } = this.host;
    this.camera = makeCamera(this.spec, clientWidth / clientHeight);
  }

  private invalidate(): void {
    if (this.frame !== null || this.disposed) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  private draw(): void {
    // Before init resolves, or while the host has no size.
    if (!this.renderer.initialized || !this.camera || !this.hasSize()) return;
    this.renderer.render(this.scene, this.camera);
    if (!this.drawn) {
      this.drawn = true;
      this.options.onFirstFrame();
    }
  }
}
