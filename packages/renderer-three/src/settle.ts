type Frames = {
  request(callback: () => void): number;
  cancel(id: number): void;
};

const animationFrames: Frames = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

/**
 * Says when a scene that draws on demand has settled: the animation frame
 * after a draw has no redraw pending, once the `ResizeObserver` has reported.
 * Its first report can come frames after the first draw, and its resize
 * redraws.
 */
export class Settle {
  private resizeReported = false;

  private check: number | null = null;

  private settled = false;

  constructor(
    private readonly redrawPending: () => boolean,
    private readonly onSettled: () => void,
    private readonly frames: Frames = animationFrames,
  ) {}

  resized(): void {
    this.resizeReported = true;
  }

  drawn(): void {
    if (this.settled) return;
    this.check ??= this.frames.request(() => {
      this.check = null;
      if (this.settled || this.redrawPending() || !this.resizeReported) return;
      this.settled = true;
      this.onSettled();
    });
  }

  dispose(): void {
    this.settled = true;
    if (this.check !== null) this.frames.cancel(this.check);
  }
}
