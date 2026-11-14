import type { KnotOptions } from "./knotAnimation";
import type { LoadStage } from "./knotProgress";

/** What the page sends the knot loader's worker. */
export type LoaderMessage =
  | {
      type: "start";
      canvas: OffscreenCanvas;
      options: KnotOptions;
      pixelRatio: number;
    }
  | { type: "stage"; stage: LoadStage };
