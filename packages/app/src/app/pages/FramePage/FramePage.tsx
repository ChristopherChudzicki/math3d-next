import React from "react";
import { useParams } from "react-router";

import Viewport from "@/features/viewport/Viewport";
import useSceneLoader from "@/app/useSceneLoader";

/**
 * A bare, scene-only view for headless screenshots — no editor UI (no header,
 * sidebar, controls, or virtual keyboard). It loads the scene by key (silently
 * — no notification/redirect on a missing scene) and renders only the 3D scene,
 * full-viewport, in `still` mode (render loop halts after warmup).
 */
const FramePage: React.FC = () => {
  const { sceneKey } = useParams();
  useSceneLoader(sceneKey, { onNotFound: "silent" });
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Viewport still />
    </div>
  );
};

export default FramePage;
