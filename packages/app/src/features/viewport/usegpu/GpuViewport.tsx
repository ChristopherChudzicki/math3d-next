/**
 * The Use.GPU (WebGPU) viewport, reached with `?renderer=usegpu`. This shell
 * imports none of Use.GPU: the renderer loads behind the one `React.lazy`
 * below, and only when `navigator.gpu` exists.
 */
import React, { Suspense, useCallback, useState } from "react";
import { useLocation } from "react-router";
import * as Sentry from "@sentry/react";
import TextLink from "@/ui/TextLink";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import is3dDisabled from "@/features/viewport/shared/is3dDisabled";
import { useHasViewportItems } from "@/features/viewport/shared/useViewportItems";

const GpuViewportContent = React.lazy(
  // eslint-disable-next-line import/no-restricted-paths -- the lazy boundary
  () => import("./live/GpuViewportContent"),
);

/** The current location without `?renderer`, which selects the default renderer. */
const useDefaultRendererLocation = () => {
  const { pathname, search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.delete("renderer");
  const query = params.toString();
  return { pathname, search: query ? `?${query}` : "", hash };
};

const Unavailable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultRenderer = useDefaultRendererLocation();
  // Centered: an open sidebar covers the viewport's left edge.
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100%",
        padding: "1em",
      }}
    >
      <p>
        {children}{" "}
        <TextLink to={defaultRenderer}>Use the default renderer</TextLink>
      </p>
    </div>
  );
};

type Props = { className?: string };

const GpuViewport: React.FC<Props> = ({ className }) => {
  const hasRequired = useHasViewportItems();
  const loadCount = useAppSelector(select.loadCount);
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback((error: unknown) => {
    // A browser limitation, not an app error.
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(error);
    Sentry.captureMessage(`WebGPU unsupported: ${message}`, { level: "info" });
    setUnsupported(true);
  }, []);

  const renderContent = () => {
    if (is3dDisabled()) return null;
    if (!("gpu" in navigator) || unsupported) {
      return (
        <Unavailable>
          WebGPU is unavailable in this browser, which the Use.GPU renderer
          needs.
        </Unavailable>
      );
    }
    if (!hasRequired) return null;
    // A failed chunk or .wasm load, or a render error, throws here; past this
    // boundary it would replace the whole editor with the route's error page.
    // Loading another scene remounts it, clearing a render error; React.lazy
    // caches a rejected import(), so a failed load stays failed until reload.
    return (
      <Sentry.ErrorBoundary
        key={loadCount}
        fallback={
          <Unavailable>The Use.GPU renderer stopped on an error.</Unavailable>
        }
      >
        <Suspense fallback={null}>
          <GpuViewportContent onUnsupported={onUnsupported} />
        </Suspense>
      </Sentry.ErrorBoundary>
    );
  };

  return (
    <div
      data-testid="scene"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      {renderContent()}
    </div>
  );
};

export default GpuViewport;
