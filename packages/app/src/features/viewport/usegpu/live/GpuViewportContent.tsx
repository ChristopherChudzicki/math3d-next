import React, { useCallback, useMemo, useRef } from "react";
import { LiveCanvas } from "@use-gpu/react";
import { useViewportItems } from "@/features/viewport/shared/useViewportItems";
import { GraphicSpecReporter } from "@/features/viewport/spec/reporter";
import {
  SpecCollector,
  useSpecCollector,
} from "@/features/viewport/spec/collector";
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
  const { graphics, camera, range, scale } = useViewportItems();
  const host = useRef<HTMLDivElement>(null);
  const { orbit, controls, projection, controlsVersion, onOrbit } = useOrbit(
    camera,
    range,
    scale,
    host,
  );
  const [specs, report] = useSpecCollector();

  const scene = useMemo<SceneSpec>(
    () => ({
      range,
      scale,
      orbit,
      controlsVersion,
      projection,
      controls,
      graphics: graphics.flatMap(({ id }) =>
        specs[id] ? [{ id, spec: specs[id] }] : [],
      ),
    }),
    [
      range,
      scale,
      orbit,
      controlsVersion,
      projection,
      controls,
      graphics,
      specs,
    ],
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
      <SpecCollector.Provider value={report}>
        {graphics.map((item) => (
          <GraphicSpecReporter key={item.id} item={item} />
        ))}
      </SpecCollector.Provider>
      <div ref={host} style={HOST_STYLE}>
        <LiveCanvas style={CANVAS_STYLE} render={render} />
      </div>
    </>
  );
};

export default GpuViewportContent;
