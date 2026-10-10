import React from "react";

/**
 * Renders a popup that takes no input once it starts closing, as if already
 * gone, while its exit animation plays.
 */
const renderInertWhileClosing = (
  props: React.ComponentProps<"div">,
  state: { open: boolean },
) => <div {...props} inert={!state.open} />;

export default renderInertWhileClosing;
