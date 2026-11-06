// The account-menu trigger: the renderer setting lives in that menu.
const RENDERER_SETTING_ID = "account-menu-trigger";

const focusRendererSetting = (): void => {
  document.getElementById(RENDERER_SETTING_ID)?.focus();
};

export { RENDERER_SETTING_ID, focusRendererSetting };
