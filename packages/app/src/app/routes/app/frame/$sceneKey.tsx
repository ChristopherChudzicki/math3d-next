import { createFileRoute } from "@tanstack/react-router";
import { mixed } from "yup";
import FramePage from "@/app/pages/FramePage/FramePage";
import { lenientSearch } from "@/util/lenientSearch";

/**
 * A scene-only render page for headless screenshots, under `/app/` so it can't
 * be mistaken for a scene.
 */
export const Route = createFileRoute("/app/frame/$sceneKey")({
  // Any `?renderer=`, `null` included: `FramePage` marks an unknown one failed
  // rather than drawing with another renderer.
  validateSearch: lenientSearch({ renderer: mixed().nullable() }),
  component: FramePage,
});
