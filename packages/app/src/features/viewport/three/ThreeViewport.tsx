/**
 * The three.js viewport. This shell imports none of three.js; the
 * `@math3d/renderer-three` package loads behind the one `React.lazy` below.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import * as Sentry from "@sentry/react";
import type { ViewportHooks } from "@math3d/viewport-spec";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";
import { useLoadFlag } from "@/features/viewport/shared/useLoadFlag";
import KnotLoader from "./loader/KnotLoader";

const RendererViewport = React.lazy(() =>
  import("@math3d/renderer-three").then((m) => ({ default: m.Viewport })),
);

/**
 * Calls `onMount` once mounted. Beside the lazy renderer, inside its
 * `Suspense`, it mounts once the renderer's chunk has arrived.
 */
const OnMount: React.FC<{ onMount: () => void }> = ({ onMount }) => {
  useEffect(onMount, [onMount]);
  return null;
};

const HOST_STYLE = { width: "100%", height: "100%" };

/**
 * `?gloss=0` lights shaded surfaces as MathBox does, for comparison captures;
 * otherwise they are glossy.
 */
const GLOSS_PARAM = "gloss";

/**
 * `?oit=0` draws translucent items in MathBox's order, for comparing the two
 * renderers. Without it they blend order-independently where the browser
 * can.
 */
const TRANSPARENCY_PARAM = "oit";

type ContentProps = Pick<
  ViewportHooks,
  "onUnsupported" | "onDrawn" | "onReady"
> & { onLoaded: () => void };

const ThreeViewportContent: React.FC<ContentProps> = ({
  onUnsupported,
  onDrawn,
  onReady,
  onLoaded,
}) => {
  const host = useRef<HTMLDivElement>(null);
  const { spec, reporters, onCameraMove } = useViewportSpec(host);
  const [searchParams] = useSearchParams();
  const transparency =
    searchParams.get(TRANSPARENCY_PARAM) === "0" ? "ordered" : undefined;
  const hooks = useMemo<ViewportHooks>(
    () => ({
      onUnsupported,
      onCameraMove,
      onDrawn,
      onReady,
    }),
    [onUnsupported, onCameraMove, onDrawn, onReady],
  );
  return (
    <>
      {reporters}
      <OnMount onMount={onLoaded} />
      <div ref={host} style={HOST_STYLE}>
        <RendererViewport
          spec={spec}
          hooks={hooks}
          transparency={transparency}
          shading={searchParams.get(GLOSS_PARAM) === "0" ? "matte" : undefined}
        />
      </div>
    </>
  );
};

type Props = {
  className?: string;
  /** Show the loading knot until the scene is drawn. */
  loader?: boolean;
};

const ThreeViewport: React.FC<Props> = ({ className, loader = true }) => {
  const [unsupported, setUnsupported] = useState(false);
  const [ready, onReady] = useLoadFlag();
  // The knot waits for the first draw, not for ready: a scene animating a
  // slider redraws every frame, so it never settles.
  const [drawn, onDrawn] = useLoadFlag();
  const [loaded, onLoaded] = useLoadFlag();
  const overlay = loader ? (
    <KnotLoader rendererLoaded={loaded} done={drawn} />
  ) : null;
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
      errorMessage="This scene couldn't be drawn."
      ready={ready}
      unsupported={unsupported}
      unsupportedMessage="This browser can't run the default 3D renderer."
      className={className}
      overlay={overlay}
    >
      <ThreeViewportContent
        onUnsupported={onUnsupported}
        onDrawn={onDrawn}
        onReady={onReady}
        onLoaded={onLoaded}
      />
    </ViewportShell>
  );
};

export default ThreeViewport;
