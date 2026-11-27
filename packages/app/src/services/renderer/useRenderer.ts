import { useCallback } from "react";
import { useSearch } from "@tanstack/react-router";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import { resolveRenderer } from "./resolveRenderer";
import type { Renderer } from "./renderers";
import {
  setRendererPreference,
  useRendererPreference,
} from "./rendererPreference";

const useRenderer = (): {
  renderer: Renderer;
  chooseRenderer: (renderer: Renderer) => void;
} => {
  const param = useSearch({ strict: false }).renderer;
  const setSearch = useSetSearch();
  const preference = useRendererPreference();
  const renderer = resolveRenderer({ param, preference });

  const chooseRenderer = useCallback(
    (choice: Renderer) => {
      setRendererPreference(choice);
      // An explicit param outranks the preference, so it has to go.
      if (param === undefined) return;
      setSearch({ renderer: undefined }, { replace: true });
    },
    [param, setSearch],
  );

  return { renderer, chooseRenderer };
};

export { useRenderer };
