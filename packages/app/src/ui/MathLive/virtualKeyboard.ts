/**
 * Whether `target` is inside MathLive's virtual keyboard (which MathLive
 * mounts on `document.body` and recreates each time it shows) or inside UI
 * that drives the keyboard from outside it, marked with
 * `data-virtual-keyboard-control`.
 */
const isVirtualKeyboardTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest(".ML__keyboard, [data-virtual-keyboard-control]") !== null;

export { isVirtualKeyboardTarget };
