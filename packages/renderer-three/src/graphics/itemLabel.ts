import type { LabelStyle } from "../label/Labels";

/**
 * Where math3d's MathBox point, line and vector labels land: its one
 * `labelOffset`, `[0, 40]`, puts them 24 CSS pixels up.
 */
export const ITEM_LABEL: LabelStyle = { weight: "bold", offset: [0, 24] };
