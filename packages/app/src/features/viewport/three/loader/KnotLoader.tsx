import React, { useEffect, useRef, useState } from "react";
import type { Rgb } from "./knotAnimation";
import type { LoadStage } from "./knotProgress";
import type { LoaderMessage } from "./messages";

const SIZE = 200;
/** The disc behind the knot; its shades blend from this color toward the ink. */
const BACKGROUND: Rgb = [255, 255, 255];
const FADE_MS = 200;
/** A scene drawn sooner never shows the knot, rather than flashing it. */
const SHOW_DELAY_MS = 400;

const CONTAINER_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  color: "var(--color-text-primary)",
  // Ease-in keeps the knot visible while it closes, early in the fade.
  transition: `opacity ${FADE_MS}ms ease-in`,
};

const DISC_SIZE = 224;

const DISC_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: DISC_SIZE,
  height: DISC_SIZE,
  borderRadius: "50%",
  background: `rgb(${BACKGROUND.join(" ")})`,
  boxShadow: "0 1px 3px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.06)",
};

const parseRgb = (css: string): Rgb => {
  const [r = 0, g = 0, b = 0] = (css.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b];
};

const canDraw = () =>
  typeof Worker !== "undefined" &&
  "transferControlToOffscreen" in HTMLCanvasElement.prototype;

type Props = {
  /** The renderer's code has arrived; the scene is being built. */
  rendererLoaded: boolean;
  /** The scene is drawn: close the knot, fade out, then unmount. */
  done: boolean;
};

/**
 * The loading knot, drawn by a Web Worker, once the load has taken
 * `SHOW_DELAY_MS`. Renders nothing without `Worker` and `OffscreenCanvas`, or
 * if the worker fails.
 */
const KnotLoader: React.FC<Props> = ({ rendererLoaded, done }) => {
  const host = useRef<HTMLDivElement>(null);
  const worker = useRef<Worker | null>(null);
  const [due, setDue] = useState(false);
  const [gone, setGone] = useState(false);
  const [failed, setFailed] = useState(false);
  const shown = due && !gone && !failed && canDraw();

  useEffect(() => {
    if (done) return undefined;
    const timer = setTimeout(() => setDue(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [done]);

  useEffect(() => {
    const element = host.current;
    if (!shown || !element) return undefined;
    // Created here rather than rendered: a canvas can hand off its drawing
    // only once, and StrictMode runs this effect twice.
    const canvas = document.createElement("canvas");
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    element.appendChild(canvas);
    let offscreen: OffscreenCanvas;
    let next: Worker;
    try {
      offscreen = canvas.transferControlToOffscreen();
      next = new Worker(new URL("./knotLoader.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      // Thrown here, it would reach the scene's error boundary and fail the
      // scene; the knot is not worth that.
      canvas.remove();
      setFailed(true);
      return undefined;
    }
    next.addEventListener("error", () => setFailed(true));
    const start: LoaderMessage = {
      type: "start",
      canvas: offscreen,
      options: {
        width: SIZE,
        height: SIZE,
        background: BACKGROUND,
        ink: parseRgb(getComputedStyle(element).color),
        still:
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
          false,
      },
      pixelRatio: window.devicePixelRatio,
    };
    next.postMessage(start, [offscreen]);
    worker.current = next;
    return () => {
      next.terminate();
      canvas.remove();
      worker.current = null;
    };
  }, [shown]);

  // After the worker effect, and on its deps, so a new worker gets the stage.
  useEffect(() => {
    let stage: LoadStage = "fetching";
    if (done) stage = "done";
    else if (rendererLoaded) stage = "building";
    const message: LoaderMessage = { type: "stage", stage };
    worker.current?.postMessage(message);
  }, [rendererLoaded, done, shown]);

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => setGone(true), FADE_MS);
    return () => clearTimeout(timer);
  }, [done]);

  if (!shown) return null;
  return (
    <div
      role="progressbar"
      aria-label="Loading scene"
      style={{ ...CONTAINER_STYLE, opacity: done ? 0 : 1 }}
    >
      <div ref={host} style={DISC_STYLE} />
    </div>
  );
};

export default KnotLoader;
