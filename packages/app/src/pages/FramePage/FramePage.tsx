import React from "react";
import { useParams } from "react-router";

import Scene from "@/features/scene";
import useSceneLoader from "@/features/scene/useSceneLoader";

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
      <Scene still />
    </div>
  );
};

export default FramePage;
