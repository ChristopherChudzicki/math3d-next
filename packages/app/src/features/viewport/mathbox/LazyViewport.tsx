import React, { Suspense } from "react";
import * as Sentry from "@sentry/react";
import RendererFallback from "@/features/viewport/shared/RendererFallback";

const Viewport = React.lazy(() => import("./Viewport"));

type Props = React.ComponentProps<typeof Viewport>;

/**
 * The MathBox viewport, loaded on first render so MathBox and its `three`
 * stay out of the main bundle.
 */
const LazyViewport: React.FC<Props> = (props) => (
  // A failed chunk load throws here; past this boundary the route's error
  // page would replace the editor. React.lazy caches the rejection.
  <Sentry.ErrorBoundary
    fallback={
      <div
        data-testid="scene"
        data-renderer="mathbox"
        data-scene-error="error"
        className={props.className}
        style={{ width: "100%", height: "100%" }}
      >
        <RendererFallback
          renderer="mathbox"
          message="The legacy renderer couldn't load."
        />
      </div>
    }
  >
    <Suspense fallback={<div className={props.className} aria-busy="true" />}>
      <Viewport {...props} />
    </Suspense>
  </Sentry.ErrorBoundary>
);

export default LazyViewport;
