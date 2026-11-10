import React, { Suspense } from "react";
import * as Sentry from "@sentry/react";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import type { Renderer } from "@/services/renderer/renderers";
import is3dDisabled from "./is3dDisabled";
import { useHasViewportItems } from "./useViewportItems";
import RendererFallback from "./RendererFallback";

type Props = {
  renderer: Renderer;
  /** Shown, with a way back to the default renderer, after a render error. */
  errorMessage: string;
  className?: string;
  /** The renderer, usually behind a `React.lazy`. */
  children: React.ReactNode;
};

/** The scene container for a renderer loaded behind `React.lazy`. */
const ViewportShell: React.FC<Props> = ({
  renderer,
  errorMessage,
  className,
  children,
}) => {
  const hasRequired = useHasViewportItems();
  const loadCount = useAppSelector(select.loadCount);
  const show = !is3dDisabled() && hasRequired;
  return (
    <div
      data-testid="scene"
      data-renderer={renderer}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      {show ? (
        // A failed chunk load or a render error throws here; past this
        // boundary it would replace the whole editor with the route's error
        // page. Loading another scene remounts it, clearing a render error;
        // React.lazy caches a rejected import(), so a failed load stays
        // failed until reload.
        <Sentry.ErrorBoundary
          key={loadCount}
          fallback={<RendererFallback message={errorMessage} />}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Sentry.ErrorBoundary>
      ) : null}
    </div>
  );
};

export default ViewportShell;
