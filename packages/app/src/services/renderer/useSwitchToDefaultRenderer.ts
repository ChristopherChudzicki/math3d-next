import { focusRendererSetting } from "./focusRendererSetting";
import { useRenderer } from "./useRenderer";

/** Switches to MathBox and focuses the menu that holds the setting. */
const useSwitchToDefaultRenderer = (): (() => void) => {
  const { chooseRenderer } = useRenderer();
  return () => {
    chooseRenderer("mathbox");
    focusRendererSetting();
  };
};

export { useSwitchToDefaultRenderer };
