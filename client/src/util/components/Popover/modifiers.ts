import type { Modifier } from "@popperjs/core";

/**
 * Popper modifier that sets placement to be either `"right-start"` or
 * `"right-end"` depending on trigger position within viewport.
 *
 * This differs from "right-auto" in that the popper will never have centered
 * placement.
 */
const rightStartEnd: Modifier<"start-end-modifier", Record<string, never>> = {
  name: "start-end-modifier",
  phase: "read",
  enabled: true,
  fn: ({ state }) => {
    const { y, height } = state.rects.reference;
    const center = y + height / 2;
    const placement =
      center < window.innerHeight / 2 ? "right-start" : "right-end";
    if (state.placement !== placement) {
      state.reset = true;
    }
    state.placement = placement;
  },
};

export { rightStartEnd };
