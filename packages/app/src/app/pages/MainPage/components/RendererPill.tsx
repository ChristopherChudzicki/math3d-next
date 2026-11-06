import React from "react";
import Button from "@/ui/Button";
import { Popover } from "@/ui/Popover";
import { useRenderer } from "@/services/renderer/useRenderer";
import { useSwitchToDefaultRenderer } from "@/services/renderer/useSwitchToDefaultRenderer";
import * as pill from "./CornerPill.module.css";
import * as styles from "./RendererPill.module.css";

/** Labels the Use.GPU viewport, with a popover that switches back to MathBox. */
const RendererPill: React.FC = () => {
  const { renderer } = useRenderer();
  const handleSwitch = useSwitchToDefaultRenderer();
  if (renderer !== "usegpu") return null;
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button size="sm" className={pill.pill}>
            WebGPU
          </Button>
        }
      />
      <Popover.Popup
        side="top"
        align="end"
        className={styles.popup}
        aria-label="WebGPU renderer"
      >
        <Popover.Description className={styles.description}>
          You&apos;re using the experimental WebGPU renderer. You can also
          change this in the menu.
        </Popover.Description>
        <Button size="sm" onClick={handleSwitch}>
          Switch to the default renderer
        </Button>
      </Popover.Popup>
    </Popover.Root>
  );
};

export default RendererPill;
