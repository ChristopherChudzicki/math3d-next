import React from "react";
import Button from "@/ui/Button";
import { Popover } from "@/ui/Popover";
import { DEFAULT_RENDERER, RENDERERS } from "@/services/renderer/renderers";
import { useRenderer } from "@/services/renderer/useRenderer";
import { useSwitchToDefaultRenderer } from "@/services/renderer/useSwitchToDefaultRenderer";
import * as pill from "./CornerPill.module.css";
import * as styles from "./RendererPill.module.css";

/**
 * Names a non-default renderer, with a popover that switches back to the
 * default.
 */
const RendererPill: React.FC = () => {
  const { renderer } = useRenderer();
  const handleSwitch = useSwitchToDefaultRenderer();
  if (!renderer || renderer === DEFAULT_RENDERER) return null;
  const { name } = RENDERERS[renderer];
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button size="sm" className={pill.pill}>
            {name}
          </Button>
        }
      />
      <Popover.Popup
        side="top"
        align="end"
        className={styles.popup}
        aria-label={`${name} renderer`}
      >
        <Popover.Description className={styles.description}>
          You&apos;re using the experimental {name} renderer. You can also
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
