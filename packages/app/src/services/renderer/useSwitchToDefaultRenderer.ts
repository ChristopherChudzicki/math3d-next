import { focusRendererSetting } from "./focusRendererSetting";
import { DEFAULT_RENDERER } from "./renderers";
import { useRenderer } from "./useRenderer";

/** Switches to the default renderer and focuses the menu trigger, where the setting lives. */
const useSwitchToDefaultRenderer = (): (() => void) => {
  const { chooseRenderer } = useRenderer();
  return () => {
    chooseRenderer(DEFAULT_RENDERER);
    focusRendererSetting();
  };
};

export { useSwitchToDefaultRenderer };
