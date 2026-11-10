import React from "react";
import Button from "@/ui/Button";
import { useSwitchToDefaultRenderer } from "@/services/renderer/useSwitchToDefaultRenderer";

/** Says why an experimental renderer isn't drawing, and offers the default one. */
const RendererFallback: React.FC<{ message: string }> = ({ message }) => {
  const switchToDefault = useSwitchToDefaultRenderer();
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
      <Button onClick={switchToDefault}>Switch to the default renderer</Button>
    </div>
  );
};

export default RendererFallback;
