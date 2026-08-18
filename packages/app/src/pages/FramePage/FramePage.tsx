import React from "react";
import { useParams, useSearchParams } from "react-router";

import Scene from "@/features/scene";
import useSceneLoader from "@/features/scene/useSceneLoader";

/** Wall-clock self-halt used when the frame URL carries no valid `?deadlineMs`,
 * so orphan protection stays on for a direct or malformed load. */
export const DEFAULT_FRAME_DEADLINE_MS = 30_000;

/** Parse `?deadlineMs`, falling back to a finite default — never undefined — so
 * the still-mode wall-clock halt can't be silently disabled by a bad value. */
export const parseDeadlineMs = (raw: string | null): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_FRAME_DEADLINE_MS;
};

/**
 * A bare, scene-only view for headless screenshots — no editor UI (no header,
 * sidebar, controls, or virtual keyboard). It loads the scene by key (silently
 * — no notification/redirect on a missing scene) and renders only the 3D scene,
 * full-viewport, in `still` mode (render loop halts after warmup).
 */
const FramePage: React.FC = () => {
  const { sceneKey } = useParams();
  useSceneLoader(sceneKey, { onNotFound: "silent" });
  const [params] = useSearchParams();
  const deadlineMs = parseDeadlineMs(params.get("deadlineMs"));
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Scene still deadlineMs={deadlineMs} />
    </div>
  );
};

export default FramePage;
