import React, { useMemo } from "react";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { useViewportItems } from "@/features/viewport/shared/useViewportItems";
import { SpecCollector, useSpecCollector } from "./collector";
import { GraphicSpecReporter } from "./reporter";
import { useCameraSpec } from "./camera";

/**
 * The scene as a `ViewportSpec`. Render `reporters` alongside the renderer:
 * the graphics' specs reach `spec` through them. `cameraItem` is for writing
 * camera moves back to the store.
 */
export const useViewportSpec = () => {
  const { graphics, camera, range, scale } = useViewportItems();
  const cameraFields = useCameraSpec(camera, range, scale);
  const [specs, report] = useSpecCollector();
  const spec = useMemo<ViewportSpec>(
    () => ({
      range,
      scale,
      ...cameraFields,
      graphics: graphics.flatMap(({ id }) =>
        specs[id] ? [{ id, spec: specs[id] }] : [],
      ),
    }),
    [range, scale, cameraFields, graphics, specs],
  );
  const reporters = useMemo(
    () => (
      <SpecCollector.Provider value={report}>
        {graphics.map((item) => (
          <GraphicSpecReporter key={item.id} item={item} />
        ))}
      </SpecCollector.Provider>
    ),
    [report, graphics],
  );
  return { spec, reporters, cameraItem: camera };
};
