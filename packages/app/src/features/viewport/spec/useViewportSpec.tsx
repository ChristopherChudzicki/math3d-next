import React, { useMemo } from "react";
import type { RefObject } from "react";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { useViewportItems } from "@/features/viewport/shared/useViewportItems";
import { SpecCollector, useSpecCollector } from "./collector";
import { GraphicSpecReporter } from "./reporter";
import { useCameraSpec } from "./camera";
import { useCameraWriteBack } from "./useCameraWriteBack";

/**
 * The scene as a `ViewportSpec`. Render `reporters` alongside the renderer:
 * they fill `spec.graphics`, which is empty without them. `onCameraMove` is
 * the renderer's `ViewportHooks.onCameraMove`; camera moves end on pointer
 * and wheel events on `host`, which should contain the renderer's canvas.
 */
export const useViewportSpec = (host: RefObject<HTMLElement | null>) => {
  const { graphics, camera, range, scale } = useViewportItems();
  const cameraFields = useCameraSpec(camera, range, scale);
  const { cameraRevision, onCameraMove } = useCameraWriteBack(
    host,
    camera,
    cameraFields.camera,
    range,
    scale,
  );
  const [specs, report] = useSpecCollector();
  const spec = useMemo<ViewportSpec>(
    () => ({
      range,
      scale,
      ...cameraFields,
      cameraRevision,
      graphics: graphics.flatMap(({ id }) =>
        specs[id] ? [{ id, spec: specs[id] }] : [],
      ),
    }),
    [range, scale, cameraFields, cameraRevision, graphics, specs],
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
  return { spec, reporters, onCameraMove };
};
