import React from "react";
import { useSearchParams } from "react-router";
import { OVERLAYS } from "./registry";
import type { OverlayName } from "./useOverlay";

const OverlayHost: React.FC = () => {
  const [search] = useSearchParams();
  const name = search.get("overlay");
  // Own-property check: a bare `OVERLAYS[name]` walks the prototype chain, so
  // `?overlay=constructor|__proto__|toString` would resolve to a truthy
  // non-component and crash to the ErrorPage. Unknown values must render nothing.
  const Overlay =
    name && Object.hasOwn(OVERLAYS, name)
      ? OVERLAYS[name as OverlayName]
      : undefined;
  return Overlay ? <Overlay /> : null;
};

export default OverlayHost;
