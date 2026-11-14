import React, { Suspense } from "react";
import * as Sentry from "@sentry/react";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import type { Renderer } from "@/services/renderer/renderers";
import is3dDisabled from "./is3dDisabled";
import { useHasViewportItems } from "./useViewportItems";
import { useLoadFlag } from "./useLoadFlag";
import RendererFallback from "./RendererFallback";

type Props = {
  renderer: Renderer;
  /** Shown after a render error, beside a button that switches renderer. */
  errorMessage: string;
  /** The renderer has called `ViewportHooks.onReady` for this scene load. */
  ready: boolean;
  /** The renderer can't run in this browser: show `unsupportedMessage` instead. */
  unsupported: boolean;
  unsupportedMessage: string;
  className?: string;
  /** The renderer, usually behind a `React.lazy`. */
  children: React.ReactNode;
  /** Drawn over the renderer, outside its `Suspense`, while there's no failure. */
  overlay?: React.ReactNode;
};

/** The scene container for a renderer loaded behind `React.lazy`. */
const ViewportShell: React.FC<Props> = ({
  renderer,
  errorMessage,
  ready,
  unsupported,
  unsupportedMessage,
  className,
  children,
  overlay,
}) => {
  const hasRequired = useHasViewportItems();
  const loadCount = useAppSelector(select.loadCount);
  const [errored, setErrored] = useLoadFlag();
  const show = !is3dDisabled() && hasRequired;
  let failure: "unsupported" | "error" | undefined;
  if (unsupported) failure = "unsupported";
  else if (errored) failure = "error";
  return (
    <div
      data-testid="scene"
      data-renderer={renderer}
      data-scene-ready={ready && !failure ? "true" : undefined}
      data-scene-error={failure}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {show ? (
        // A failed chunk load or a render error throws here; past this
        // boundary it would replace the whole editor with the route's error
        // page. Loading another scene remounts it, clearing a render error;
        // React.lazy caches a rejected import(), so a failed load stays
        // failed until reload.
        <Sentry.ErrorBoundary
          key={loadCount}
          fallback={
            <RendererFallback renderer={renderer} message={errorMessage} />
          }
          onError={setErrored}
        >
          {failure ? (
            <RendererFallback
              renderer={renderer}
              message={unsupported ? unsupportedMessage : errorMessage}
            />
          ) : (
            <Suspense fallback={null}>{children}</Suspense>
          )}
          {failure ? null : overlay}
        </Sentry.ErrorBoundary>
      ) : null}
    </div>
  );
};

export default ViewportShell;
