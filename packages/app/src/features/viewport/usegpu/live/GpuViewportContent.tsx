import React, { useCallback, useMemo, useRef } from "react";
import { LiveCanvas } from "@use-gpu/react";
import { MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import { fromUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import { useViewportItems } from "@/features/viewport/shared/useViewportItems";
import { GraphicSpecReporter } from "@/features/viewport/usegpu/graphicSpec/reporter";
import {
  SpecCollector,
  useSpecCollector,
} from "@/features/viewport/usegpu/graphicSpec/collector";
import type { CameraSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import { toOrbit } from "@/features/viewport/usegpu/orbit";
import { useOrbitWriteBack } from "@/features/viewport/usegpu/useOrbitWriteBack";
import { makeSceneRoot } from "./scene";
import type { SceneHooks, SceneSpec } from "./scene";

const CAMERA_PROPS = [
  "position",
  "target",
  "useRelative",
  "isRotateEnabled",
  "isPanEnabled",
  "isZoomEnabled",
  "isOrthographic",
  "updateOnDrag",
] as const;

const useOrbit = (
  camera: MathItem<MathItemType.Camera>,
  range: AxesRange,
  scale: Coords,
  host: React.RefObject<HTMLElement | null>,
) => {
  const scope = useMathScope();
  const {
    position,
    target,
    useRelative,
    isRotateEnabled,
    isPanEnabled,
    isZoomEnabled,
    isOrthographic,
    updateOnDrag,
  } = useMathItemResults(scope, camera, CAMERA_PROPS);
  const controls = useMemo<SceneSpec["controls"]>(
    () => ({
      rotate: isRotateEnabled ?? true,
      pan: isPanEnabled ?? true,
      zoom: isZoomEnabled ?? true,
    }),
    [isRotateEnabled, isPanEnabled, isZoomEnabled],
  );
  const spec = useMemo<CameraSpec>(
    () => ({
      position: fromUi(position ?? [0.5, -2, 0.5], range, scale, !!useRelative),
      target: fromUi(target ?? [0, 0, 0], range, scale, !!useRelative),
    }),
    [position, target, useRelative, range, scale],
  );
  // Keeps orbit.target's identity; see SceneSpec.orbit.
  const orbit = useMemo(() => toOrbit(spec), [spec]);
  const projection = useMemo(
    () => ({ dolly: isOrthographic ? 0 : 1 }),
    [isOrthographic],
  );
  const stored = useMemo(
    () => ({
      id: camera.id,
      position,
      target,
      useRelative: !!useRelative,
      updateOnDrag: !!updateOnDrag,
    }),
    [camera.id, position, target, useRelative, updateOnDrag],
  );
  const { onOrbit, controlsVersion } = useOrbitWriteBack(
    host,
    stored,
    range,
    scale,
  );
  return { orbit, controls, projection, controlsVersion, onOrbit };
};

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

  const render = useCallback(
    (canvas: HTMLCanvasElement) =>
      makeSceneRoot(canvas, scene, { onUnsupported, onOrbit }),
    [scene, onUnsupported, onOrbit],
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
