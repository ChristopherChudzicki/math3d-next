import React, { useCallback, useMemo, useRef } from "react";
import { LiveCanvas } from "@use-gpu/react";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";
import { useOrbit } from "@/features/viewport/usegpu/useOrbit";
import { makeSceneRoot } from "./scene";
import type { SceneHooks, SceneSpec } from "./scene";

const CANVAS_STYLE = { width: "100%", height: "100%", display: "block" };
// Without it, touch drags scroll or zoom the page instead of orbiting.
const HOST_STYLE = { width: "100%", height: "100%", touchAction: "none" };

type Props = { onUnsupported: SceneHooks["onUnsupported"] };

/**
 * The entry to usegpu/live, the only code that imports Use.GPU's runtime.
 * `usegpu/GpuViewport` loads it with React.lazy.
 */
const GpuViewportContent: React.FC<Props> = ({ onUnsupported }) => {
  const { spec, reporters, cameraItem } = useViewportSpec();
  const host = useRef<HTMLDivElement>(null);
  const { orbit, projection, controlsVersion, onOrbit } = useOrbit(
    spec,
    cameraItem,
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

  const reportOrbit = useCallback(
    (next: Parameters<typeof onOrbit>[0]) => {
      // The controls first render once the adapter and device are up; E2E waits on it.
      host.current?.setAttribute("data-ready", "");
      onOrbit(next);
    },
    [onOrbit],
  );
  const render = useCallback(
    (canvas: HTMLCanvasElement) =>
      makeSceneRoot(canvas, scene, { onUnsupported, onOrbit: reportOrbit }),
    [scene, onUnsupported, reportOrbit],
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

export default GpuViewportContent;
