/**
 * Spike: the scene viewport rendered with Use.GPU (WebGPU) instead of MathBox.
 * Reached with `?renderer=usegpu`. Draws axes, grids, points, lines, curves,
 * parametric/explicit surfaces and implicit surfaces; vectors, vector fields
 * and labels are not drawn, and the camera does not write back to the scene.
 */
import React, { useCallback, useMemo, useState } from "react";
import { LiveCanvas } from "@use-gpu/react";
import { isMathGraphic, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathItemResults } from "@/store/scene/evaluation/mathScope";
import useAxesInfo from "@/features/viewport/shared/useAxesInfo";
import { project } from "@/features/viewport/shared/coordinates";
import type { AxesRange } from "@/features/viewport/shared/coordinates";
import { GraphicSpecReporter, SpecCollector } from "./graphicSpecs";
import { makeSceneRoot } from "./liveScene";
import { toOrbit } from "./camera";
import type { CameraSpec, Coords, GraphicSpec, SceneSpec } from "./specs";

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];

const CAMERA_PROPS = [
  "position",
  "target",
  "useRelative",
  "isRotateEnabled",
  "isPanEnabled",
  "isZoomEnabled",
] as const;

/** The camera item's position/target in MathBox cartesian coordinates, as ../Camera.tsx computes them. */
const useCameraSpec = (
  camera: Parameters<typeof useMathItemResults>[1],
  range: AxesRange,
  scale: Coords,
) => {
  const scope = useMathScope();
  invariant(camera.type === MathItemType.Camera);
  const {
    position,
    target,
    useRelative,
    isRotateEnabled,
    isPanEnabled,
    isZoomEnabled,
  } = useMathItemResults(scope, camera, CAMERA_PROPS);
  const controls = useMemo<SceneSpec["controls"]>(
    () => ({
      rotate: isRotateEnabled ?? true,
      pan: isPanEnabled ?? true,
      zoom: isZoomEnabled ?? true,
    }),
    [isRotateEnabled, isPanEnabled, isZoomEnabled],
  );
  const spec = useMemo<CameraSpec>(() => {
    const threeRange: AxesRange = [
      [-scale[0], scale[0]],
      [-scale[1], scale[1]],
      [-scale[2], scale[2]],
    ];
    const fromUi = (pos: Coords): Coords =>
      useRelative
        ? (pos.map((p, i) => p * scale[i]) as Coords)
        : project(pos, range, threeRange);
    return {
      position: fromUi(position ?? [0.5, -2, 0.5]),
      target: fromUi(target ?? [0, 0, 0]),
    };
  }, [position, target, useRelative, range, scale]);
  // Memoised so the orbit (and its `target` array) keeps its identity across
  // unrelated scene changes; OrbitControls re-seeds from a new target.
  const orbit = useMemo(() => toOrbit(spec), [spec]);
  return { orbit, controls };
};

const useSpecCollector = () => {
  const [specs, setSpecs] = useState<Record<string, GraphicSpec>>({});
  const report = useCallback((id: string, spec: GraphicSpec | null) => {
    setSpecs((current) => {
      if (spec === null) {
        if (!(id in current)) return current;
        const { [id]: _removed, ...rest } = current;
        return rest;
      }
      if (current[id] === spec) return current;
      return { ...current, [id]: spec };
    });
  }, []);
  return [specs, report] as const;
};

const CANVAS_STYLE = { width: "100%", height: "100%", display: "block" };

const GpuViewportContent: React.FC = () => {
  const items = useAppSelector(select.stableOrderedMathItems);
  const [x, y, z, camera] = useAppSelector((state) =>
    select.getItems(state, REQUIRED_ITEMS),
  );
  const { scale, range } = useAxesInfo(x, y, z);
  const { orbit, controls } = useCameraSpec(camera, range, scale);
  const [specs, report] = useSpecCollector();
  const graphics = useMemo(() => items.filter(isMathGraphic), [items]);

  const scene = useMemo<SceneSpec>(
    () => ({
      range,
      scale,
      orbit,
      controls,
      graphics: graphics.flatMap(({ id }) =>
        specs[id] ? [{ id, spec: specs[id] }] : [],
      ),
    }),
    [range, scale, orbit, controls, graphics, specs],
  );

  const render = useCallback(
    (canvas: HTMLCanvasElement) => makeSceneRoot(canvas, scene),
    [scene],
  );

  return (
    <>
      <SpecCollector.Provider value={report}>
        {graphics.map((item) => (
          <GraphicSpecReporter key={item.id} item={item} range={range} />
        ))}
      </SpecCollector.Provider>
      <LiveCanvas style={CANVAS_STYLE} render={render} />
    </>
  );
};

const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;

type Props = { className?: string };

const GpuViewport: React.FC<Props> = ({ className }) => {
  const hasRequired = useAppSelector(select.hasItems(REQUIRED_ITEMS));
  return (
    <div
      data-testid="scene"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      {!hasWebGPU && (
        <p style={{ padding: "1em" }}>
          This browser has no WebGPU, which the Use.GPU renderer needs.
        </p>
      )}
      {hasWebGPU && hasRequired && <GpuViewportContent />}
    </div>
  );
};

export default GpuViewport;
