/**
 * The three.js viewport. This shell imports none of three.js; the
 * `@math3d/renderer-three` package loads behind the one `React.lazy` below.
 */
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import * as Sentry from "@sentry/react";
import type { ViewportHooks } from "@math3d/viewport-spec";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";
import { useLoadFlag } from "@/features/viewport/shared/useLoadFlag";

const RendererViewport = React.lazy(() =>
  import("@math3d/renderer-three").then((m) => ({ default: m.Viewport })),
);

const HOST_STYLE = { width: "100%", height: "100%" };

/**
 * `?oit=0` draws translucent items in MathBox's order, for comparing the two
 * renderers; `?oit=1` draws them order-independently. Without it, the
 * renderer's default for its backend.
 */
const TRANSPARENCY_PARAM = "oit";
type Transparency = React.ComponentProps<
  typeof RendererViewport
>["transparency"];
const TRANSPARENCIES = new Map<string | null, Transparency>([
  ["0", "ordered"],
  ["1", "oit"],
]);

const ThreeViewportContent: React.FC<
  Pick<ViewportHooks, "onUnsupported" | "onReady">
> = ({ onUnsupported, onReady }) => {
  const host = useRef<HTMLDivElement>(null);
  const { spec, reporters, onCameraMove } = useViewportSpec(host);
  const [searchParams] = useSearchParams();
  const transparency = TRANSPARENCIES.get(searchParams.get(TRANSPARENCY_PARAM));
  const hooks = useMemo<ViewportHooks>(
    () => ({
      onUnsupported,
      onCameraMove,
      onReady,
    }),
    [onUnsupported, onCameraMove, onReady],
  );
  return (
    <>
      {reporters}
      <div ref={host} style={HOST_STYLE}>
        <RendererViewport
          spec={spec}
          hooks={hooks}
          transparency={transparency}
        />
      </div>
    </>
  );
};

type Props = { className?: string };

const ThreeViewport: React.FC<Props> = ({ className }) => {
  const [unsupported, setUnsupported] = useState(false);
  const [ready, onReady] = useLoadFlag();
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
      ready={ready}
      unsupported={unsupported}
      unsupportedMessage="The three.js renderer can't run in this browser."
      className={className}
    >
      <ThreeViewportContent onUnsupported={onUnsupported} onReady={onReady} />
    </ViewportShell>
  );
};

export default ThreeViewport;
