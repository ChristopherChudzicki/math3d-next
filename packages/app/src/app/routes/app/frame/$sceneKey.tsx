import { createFileRoute } from "@tanstack/react-router";
import FramePage from "@/app/pages/FramePage/FramePage";

/**
 * A scene-only render page for headless screenshots, under `/app/` so it can't
 * be mistaken for a scene.
 */
export const Route = createFileRoute("/app/frame/$sceneKey")({
  component: FramePage,
});
