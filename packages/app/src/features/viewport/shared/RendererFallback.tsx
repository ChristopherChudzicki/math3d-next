import React from "react";
import Button from "@/ui/Button";
import {
  DEFAULT_RENDERER,
  LEGACY_RENDERER,
} from "@/services/renderer/renderers";
import type { Renderer } from "@/services/renderer/renderers";
import { useSwitchRenderer } from "@/services/renderer/useSwitchRenderer";

/**
 * Says why `renderer` isn't drawing and offers another: the legacy renderer
 * when `renderer` is the default, else the default.
 */
const RendererFallback: React.FC<{ renderer: Renderer; message: string }> = ({
  renderer,
  message,
}) => {
  const switchRenderer = useSwitchRenderer();
  const isDefault = renderer === DEFAULT_RENDERER;
  // Centered: an open sidebar covers the viewport's left edge.
  return (
    <div
      style={{
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: "1em",
        height: "100%",
        padding: "1em",
      }}
    >
      <p style={{ margin: 0 }}>{message}</p>
      <Button
        onClick={() =>
          switchRenderer(isDefault ? LEGACY_RENDERER : DEFAULT_RENDERER)
        }
      >
        {isDefault
          ? "Switch to the legacy renderer"
          : "Switch to the default renderer"}
      </Button>
    </div>
  );
};

export default RendererFallback;
