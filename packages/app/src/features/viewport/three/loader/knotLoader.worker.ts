/**
 * Draws the loading knot off the main thread, so it keeps moving while the
 * page is busy building the scene.
 */
import { createKnotAnimation } from "./knotAnimation";
import type { KnotAnimation } from "./knotAnimation";
import type { LoaderMessage } from "./messages";

const nextFrame = (callback: (now: number) => void) => {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(callback);
  } else {
    setTimeout(() => callback(performance.now()), 16);
  }
};

let animation: KnotAnimation | null = null;

const start = (message: Extract<LoaderMessage, { type: "start" }>) => {
  const { canvas, options, pixelRatio } = message;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = Math.round(options.width * pixelRatio);
  canvas.height = Math.round(options.height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const current = createKnotAnimation(ctx, options);
  animation = current;
  let last = performance.now();
  const tick = (now: number) => {
    // Clamped so a stalled or hidden tab doesn't jump the animation.
    current.draw(Math.min(0.05, (now - last) / 1000));
    last = now;
    nextFrame(tick);
  };
  nextFrame(tick);
};

globalThis.addEventListener("message", (event: MessageEvent<LoaderMessage>) => {
  const message = event.data;
  if (message.type === "start") start(message);
  else animation?.setStage(message.stage);
});
