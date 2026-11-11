import React from "react";
import { useParams, useSearchParams } from "react-router";

import Viewport from "@/features/viewport/mathbox/Viewport";
import GpuViewport from "@/features/viewport/usegpu/GpuViewport";
import ThreeViewport from "@/features/viewport/three/ThreeViewport";
import { DEFAULT_RENDERER, isRenderer } from "@/services/renderer/renderers";
import type { Renderer } from "@/services/renderer/renderers";
import { RENDERER_PARAM } from "@/services/renderer/useRenderer";
import useSceneLoader from "@/app/useSceneLoader";

const VIEWPORTS: Record<Renderer, React.ReactElement> = {
  mathbox: <Viewport still />,
  usegpu: <GpuViewport still />,
  threejs: <ThreeViewport />,
};

/**
 * A bare, scene-only view for headless screenshots — no editor UI (no header,
 * sidebar, controls, or virtual keyboard). It loads the scene by key and
 * renders only the 3D scene, full-viewport, with the renderer `?renderer=`
 * names (MathBox without it; never the stored preference). The scene's
 * container gets `data-scene-ready="true"` once drawn and settled, or
 * `data-scene-error` when the renderer can't draw; there is no fallback.
 */
const FramePage: React.FC = () => {
  const { sceneKey } = useParams();
  useSceneLoader(sceneKey);
  const param = useSearchParams()[0].get(RENDERER_PARAM) ?? DEFAULT_RENDERER;
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {isRenderer(param) ? (
        VIEWPORTS[param]
      ) : (
        <div data-testid="scene" data-scene-error="invalid-renderer" />
      )}
    </div>
  );
};

export default FramePage;
