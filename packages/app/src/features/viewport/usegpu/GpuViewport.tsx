/**
 * The Use.GPU (WebGPU) viewport. This shell imports none of Use.GPU; the
 * renderer loads behind the one `React.lazy` below.
 */
import React, { Suspense, useCallback } from "react";
import * as Sentry from "@sentry/react";
import Button from "@/ui/Button";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import { setRendererPreference } from "@/services/renderer/rendererPreference";
import { useSwitchToDefaultRenderer } from "@/services/renderer/useSwitchToDefaultRenderer";
import { markWebGpuFailed } from "@/services/renderer/webgpuSupport";
import is3dDisabled from "@/features/viewport/shared/is3dDisabled";
import { useHasViewportItems } from "@/features/viewport/shared/useViewportItems";

const GpuViewportContent = React.lazy(
  // eslint-disable-next-line import/no-restricted-paths -- the lazy boundary
  () => import("./live/GpuViewportContent"),
);

const ErrorFallback: React.FC = () => {
  const switchToDefault = useSwitchToDefaultRenderer();
  // Centered: an open sidebar covers the viewport's left edge.
  return (
    <div
      style={{
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: "1em",
        height: "100%",
        padding: "1em",
      }}
    >
      <p style={{ margin: 0 }}>The WebGPU renderer ran into an error.</p>
      <Button onClick={switchToDefault}>Switch to the default renderer</Button>
    </div>
  );
};

type Props = { className?: string };

const GpuViewport: React.FC<Props> = ({ className }) => {
  const hasRequired = useHasViewportItems();
  const loadCount = useAppSelector(select.loadCount);
  const onUnsupported = useCallback((error: unknown) => {
    // Use.GPU calls this on every render while in error; report the first.
    if (!markWebGpuFailed()) return;
    // Not `chooseRenderer`: the user didn't choose this, so `?renderer` stays;
    // resolution draws MathBox once WebGPU has failed.
    setRendererPreference("mathbox");
    // A browser or device limitation, not an app error.
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(error);
    Sentry.captureMessage(`WebGPU unsupported: ${message}`, { level: "info" });
  }, []);

  const renderContent = () => {
    if (is3dDisabled() || !hasRequired) return null;
    // A failed chunk or .wasm load, or a render error, throws here; past this
    // boundary it would replace the whole editor with the route's error page.
    // Loading another scene remounts it, clearing a render error; React.lazy
    // caches a rejected import(), so a failed load stays failed until reload.
    return (
      <Sentry.ErrorBoundary key={loadCount} fallback={<ErrorFallback />}>
        <Suspense fallback={null}>
          <GpuViewportContent onUnsupported={onUnsupported} />
        </Suspense>
      </Sentry.ErrorBoundary>
    );
  };

  return (
    <div
      data-testid="scene"
      data-renderer="usegpu"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      {renderContent()}
    </div>
  );
};

export default GpuViewport;
