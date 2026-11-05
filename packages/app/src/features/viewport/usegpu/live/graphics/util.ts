import type { RGBA } from "@/features/viewport/usegpu/graphicSpec/types";

/**
 * Translucent graphics go through the weighted-blended OIT pass, so their
 * draw order never matters. Opaque ones use the ordinary depth-tested path.
 */
export const drawMode = (color: RGBA) => (color[3] < 1 ? "oit" : "opaque");
