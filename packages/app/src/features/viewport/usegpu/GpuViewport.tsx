/**
 * The Use.GPU (WebGPU) viewport, reached with `?renderer=usegpu`. This shell
 * imports none of Use.GPU: the renderer loads behind the one `React.lazy`
 * below, and only when `navigator.gpu` exists.
 */
import React, { Suspense, useCallback, useState } from "react";
import { useLocation } from "react-router";
import TextLink from "@/ui/TextLink";
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

type Props = { className?: string };

const GpuViewport: React.FC<Props> = ({ className }) => {
  const hasRequired = useHasViewportItems();
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    setUnsupported(true);
  }, []);
  const defaultRenderer = useDefaultRendererLocation();

  const renderContent = () => {
    if (is3dDisabled()) return null;
    if (!("gpu" in navigator) || unsupported) {
      return (
        <p style={{ padding: "1em" }}>
          WebGPU is unavailable in this browser, which the Use.GPU renderer
          needs.{" "}
          <TextLink to={defaultRenderer}>Use the default renderer</TextLink>
        </p>
      );
    }
    if (!hasRequired) return null;
    return (
      <Suspense fallback={null}>
        <GpuViewportContent onUnsupported={onUnsupported} />
      </Suspense>
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
