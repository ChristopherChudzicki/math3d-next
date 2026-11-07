import { focusRendererSetting } from "./focusRendererSetting";
import { useRenderer } from "./useRenderer";

/** Switches to MathBox and focuses the menu trigger, where the setting lives. */
const useSwitchToDefaultRenderer = (): (() => void) => {
  const { chooseRenderer } = useRenderer();
  return () => {
    chooseRenderer("mathbox");
    focusRendererSetting();
  };
};

export { useSwitchToDefaultRenderer };
