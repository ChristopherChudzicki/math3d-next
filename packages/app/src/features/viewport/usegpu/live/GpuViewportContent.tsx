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
  // A new scene load remounts this, with a new `onReady`.
  const [settle] = useState(() => makeSettleWatch(onReady));
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
      });
    },
    [scene, onUnsupported, onOrbit, settle],
  );

  return (
    <>
      {reporters}
      <div ref={host} style={HOST_STYLE}>
        <LiveCanvas style={CANVAS_STYLE} render={render} />
      </div>
    </>
  );
};

// A re-render redraws, so the viewport's own state changes must not reach it.
export default React.memo(GpuViewportContent);
