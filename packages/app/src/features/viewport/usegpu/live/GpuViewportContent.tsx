import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LiveCanvas } from "@use-gpu/react";
import type { ViewportHooks } from "@math3d/viewport-spec";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";
import { useOrbit } from "@/features/viewport/usegpu/useOrbit";
import {
  makeSettleWatch,
  observeCanvas,
} from "@/features/viewport/usegpu/settle";
import { makeSceneRoot } from "./scene";
import type { SceneSpec } from "./scene";

const CANVAS_STYLE = { width: "100%", height: "100%", display: "block" };
// Without it, touch drags scroll or zoom the page instead of orbiting.
const HOST_STYLE = { width: "100%", height: "100%", touchAction: "none" };

type Props = Pick<ViewportHooks, "onUnsupported" | "onReady">;

/**
 * The entry to usegpu/live, the only code that imports Use.GPU's runtime.
 * `usegpu/GpuViewport` loads it with React.lazy.
 */
const GpuViewportContent: React.FC<Props> = ({ onUnsupported, onReady }) => {
  const host = useRef<HTMLDivElement>(null);
  // `settle` keeps the first `onReady`; a new scene load remounts this with a
  // new one.
  const [settle] = useState(() => makeSettleWatch(onReady));
  const [failure, setFailure] = useState<{ error: Error } | null>(null);
  const onError = useCallback((error: Error) => setFailure({ error }), []);
  useEffect(() => () => settle.cancel(), [settle]);
  const observed = useRef<HTMLCanvasElement | null>(null);
  const { spec, reporters, onCameraMove } = useViewportSpec(host);
  const { orbit, projection, controlsVersion, onOrbit } = useOrbit(
    spec,
    onCameraMove,
    host,
  );

  const scene = useMemo<SceneSpec>(
    () => ({
      range: spec.range,
      scale: spec.scale,
      controls: spec.controls,
      graphics: spec.graphics,
      orbit,
      controlsVersion,
      projection,
    }),
    [spec, orbit, controlsVersion, projection],
  );

  const render = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (observed.current !== canvas) {
        observed.current = canvas;
        observeCanvas(canvas, settle);
      }
      return makeSceneRoot(canvas, scene, {
        onUnsupported,
        onOrbit,
        onGraphicsMounted: settle.arm,
        onError,
      });
    },
    [scene, onUnsupported, onOrbit, settle, onError],
  );

  // Rethrown during render so the error boundary above sees it.
  if (failure) throw failure.error;
  return (
    <>
      {reporters}
      <div ref={host} style={HOST_STYLE}>
        <LiveCanvas style={CANVAS_STYLE} render={render} />
      </div>
    </>
  );
};

// Every re-render draws a frame, so `GpuViewport`'s `ready` state must not
// re-render this.
export default React.memo(GpuViewportContent);
