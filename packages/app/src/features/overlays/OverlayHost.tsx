import React from "react";
import { useSearchParams } from "react-router";
import { OVERLAYS } from "./registry";

const OverlayHost: React.FC = () => {
  const [search] = useSearchParams();
  const name = search.get("overlay");
  const Overlay = name ? OVERLAYS[name] : undefined;
  return Overlay ? <Overlay /> : null;
};

export default OverlayHost;
