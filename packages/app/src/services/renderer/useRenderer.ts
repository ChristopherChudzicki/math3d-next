import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { resolveRenderer } from "./resolveRenderer";
import type { ResolvedRenderer } from "./resolveRenderer";
import type { Renderer } from "./renderers";
import {
  setRendererPreference,
  useRendererPreference,
} from "./rendererPreference";
import { useWebGpuSupport } from "./webgpuSupport";

const RENDERER_PARAM = "renderer";

const useRenderer = (): ResolvedRenderer & {
  chooseRenderer: (renderer: Renderer) => void;
} => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const preference = useRendererPreference();
  const webgpu = useWebGpuSupport();
  const resolved = resolveRenderer({
    param: searchParams.get(RENDERER_PARAM),
    preference,
    webgpu,
  });

  const chooseRenderer = useCallback(
    (renderer: Renderer) => {
      setRendererPreference(renderer);
      // An explicit param outranks the preference, so it has to go.
      if (!searchParams.has(RENDERER_PARAM)) return;
      const next = new URLSearchParams(searchParams);
      next.delete(RENDERER_PARAM);
      const search = next.toString();
      navigate(
        { search: search ? `?${search}` : "", hash: location.hash },
        { replace: true, state: location.state },
      );
    },
    [searchParams, navigate, location.hash, location.state],
  );

  return { ...resolved, chooseRenderer };
};

export { RENDERER_PARAM, useRenderer };
