/**
 * Use.GPU draws on demand and has no "done" event, so settling is inferred
 * from its frames and its pipeline compiles: a layer draws nothing until its
 * pipeline, compiled asynchronously, resolves.
 */

/** Quiet for this long, with no compile pending, means settled. */
export const SETTLE_QUIET_MS = 300;

type SettleWatch = {
  /**
   * The graphics have mounted. Frames before it don't count: Use.GPU draws an
   * empty scene while its font loads.
   */
  arm(): void;
  frame(): void;
  compileStarted(): void;
  compileEnded(): void;
  /** Stops the pending countdown; the next frame or finished compile restarts it. */
  cancel(): void;
};

/**
 * Calls `onSettled` once: `SETTLE_QUIET_MS` after the last frame or compile,
 * once a frame has been drawn since `arm()` and no compile is pending.
 */
export const makeSettleWatch = (onSettled: () => void): SettleWatch => {
  let armed = false;
  let drawn = false;
  let done = false;
  let compiling = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const restart = () => {
    clearTimeout(timer);
    if (!drawn || done || compiling > 0) return;
    timer = setTimeout(() => {
      done = true;
      onSettled();
    }, SETTLE_QUIET_MS);
  };
  return {
    arm() {
      armed = true;
    },
    frame() {
      drawn ||= armed;
      restart();
    },
    compileStarted() {
      compiling += 1;
      clearTimeout(timer);
    },
    compileEnded() {
      compiling -= 1;
      restart();
    },
    cancel() {
      clearTimeout(timer);
    },
  };
};

const ASYNC_PIPELINES = [
  "createRenderPipelineAsync",
  "createComputePipelineAsync",
] as const;

/**
 * Reports Use.GPU's frames on `canvas` (each takes the canvas's current
 * texture) and its pipeline compiles (on the device it configures the canvas
 * with) to `watch`.
 */
export const observeCanvas = (
  canvas: HTMLCanvasElement,
  watch: SettleWatch,
): void => {
  const context = canvas.getContext("webgpu");
  if (!context) return;
  const getCurrentTexture = context.getCurrentTexture.bind(context);
  context.getCurrentTexture = () => {
    watch.frame();
    return getCurrentTexture();
  };
  const configure = context.configure.bind(context);
  const observed = new WeakSet<GPUDevice>();
  context.configure = (configuration) => {
    const { device } = configuration;
    if (!observed.has(device)) {
      observed.add(device);
      ASYNC_PIPELINES.forEach((method) => {
        const create = device[method].bind(device) as (
          descriptor: never,
        ) => Promise<unknown>;
        // @ts-expect-error The wrapper returns what `create` does.
        device[method] = (descriptor: never) => {
          watch.compileStarted();
          return create(descriptor).finally(watch.compileEnded);
        };
      });
    }
    configure(configuration);
  };
};
