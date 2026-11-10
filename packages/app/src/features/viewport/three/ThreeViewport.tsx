/**
 * The three.js viewport. This shell imports none of three.js; the
 * `@math3d/renderer-three` package loads behind the one `React.lazy` below.
 */
import React, { useCallback, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/react";
import type { ViewportHooks } from "@math3d/viewport-spec";
import RendererFallback from "@/features/viewport/shared/RendererFallback";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";

const RendererViewport = React.lazy(() =>
  import("@math3d/renderer-three").then((m) => ({ default: m.Viewport })),
);

const HOST_STYLE = { width: "100%", height: "100%" };

const ThreeViewportContent: React.FC<{
  onUnsupported: ViewportHooks["onUnsupported"];
}> = ({ onUnsupported }) => {
  const host = useRef<HTMLDivElement>(null);
  const { spec, reporters, onCameraMove } = useViewportSpec(host);
  const hooks = useMemo<ViewportHooks>(
    () => ({
      onUnsupported,
      onCameraMove,
      // E2E waits on it.
      onReady: () => host.current?.setAttribute("data-ready", ""),
    }),
    [onUnsupported, onCameraMove],
  );
  return (
    <>
      {reporters}
      <div ref={host} style={HOST_STYLE}>
        <RendererViewport spec={spec} hooks={hooks} />
      </div>
    </>
  );
};

type Props = { className?: string };

const ThreeViewport: React.FC<Props> = ({ className }) => {
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback((error: unknown) => {
    setUnsupported(true);
    // A browser or device limitation, not an app error.
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(error);
    Sentry.captureMessage(`three.js unsupported: ${message}`, {
      level: "info",
    });
  }, []);

  return (
    <ViewportShell
      renderer="threejs"
      errorMessage="The three.js renderer ran into an error."
      className={className}
    >
      {unsupported ? (
        <RendererFallback message="The three.js renderer can't run in this browser." />
      ) : (
        <ThreeViewportContent onUnsupported={onUnsupported} />
      )}
    </ViewportShell>
  );
};

export default ThreeViewport;
