import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { resolveRenderer } from "./resolveRenderer";
import type { Renderer } from "./renderers";
import {
  setRendererPreference,
  useRendererPreference,
} from "./rendererPreference";

const RENDERER_PARAM = "renderer";

const useRenderer = (): {
  renderer: Renderer;
  chooseRenderer: (renderer: Renderer) => void;
} => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const preference = useRendererPreference();
  const renderer = resolveRenderer({
    param: searchParams.get(RENDERER_PARAM),
    preference,
  });

  const chooseRenderer = useCallback(
    (choice: Renderer) => {
      setRendererPreference(choice);
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

  return { renderer, chooseRenderer };
};

export { RENDERER_PARAM, useRenderer };
