import { useCallback } from "react";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import { useRootSearch } from "@/services/navigation/urlState";
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
  const param = useRootSearch().renderer;
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
