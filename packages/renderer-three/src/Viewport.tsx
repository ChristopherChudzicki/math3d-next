import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ViewportHooks, ViewportSpec } from "@math3d/viewport-spec";
import { ThreeScene } from "./ThreeScene";

export type ViewportProps = {
  spec: ViewportSpec;
  hooks: ViewportHooks;
  /** Use the WebGL2 backend even where WebGPU is available. */
  forceWebGL?: boolean;
};

const HOST_STYLE = { width: "100%", height: "100%" };

/** The three.js viewport. */
const Viewport: React.FC<ViewportProps> = ({
  spec,
  hooks,
  forceWebGL = false,
}) => {
  const host = useRef<HTMLDivElement>(null);
  const latestHooks = useRef(hooks);
  useLayoutEffect(() => {
    latestHooks.current = hooks;
  });
  const [scene, setScene] = useState<ThreeScene | null>(null);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);

  useEffect(() => {
    if (!host.current) return undefined;
    let current = true;
    const next = new ThreeScene(host.current, {
      forceWebGL,
      onFirstFrame: () => latestHooks.current.onReady(),
      onCameraMove: (camera) => latestHooks.current.onCameraMove(camera),
      onError: (error) => {
        if (current) setFailure({ error });
      },
    });
    next.init().then(
      () => {
        if (current) setScene(next);
      },
      (error: unknown) => {
        if (current) latestHooks.current.onUnsupported(error);
      },
    );
    return () => {
      current = false;
      next.dispose();
      setScene(null);
    };
  }, [forceWebGL]);

  useEffect(() => {
    scene?.setSpec(spec);
  }, [scene, spec]);

  // Rethrown during render so the error boundary above sees it.
  if (failure) throw failure.error;
  return <div ref={host} style={HOST_STYLE} />;
};

export default Viewport;
