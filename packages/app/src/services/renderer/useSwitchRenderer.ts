import { focusRendererSetting } from "./focusRendererSetting";
import type { Renderer } from "./renderers";
import { useRenderer } from "./useRenderer";

/** Switches renderer and focuses the menu trigger, where the setting lives. */
const useSwitchRenderer = (): ((renderer: Renderer) => void) => {
  const { chooseRenderer } = useRenderer();
  return (renderer) => {
    chooseRenderer(renderer);
    focusRendererSetting();
  };
};

export { useSwitchRenderer };
