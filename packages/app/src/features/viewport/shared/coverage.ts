import type {
  MathGraphicType,
  MathItem,
  MathItemType,
} from "@math3d/mathitem-configs";

/**
 * How a renderer handles one stored property. `approximate` and `n/a` say why;
 * `todo` marks a property the renderer ignores for now.
 */
export type Coverage =
  | "drawn"
  | `approximate: ${string}`
  | `n/a: ${string}`
  | "todo";

type RenderedType = MathGraphicType | MathItemType.Camera;

/**
 * Every property of every item a viewport renders. A property added in
 * mathitem-configs fails typecheck until each renderer's table classifies it.
 */
export type CoverageTable = {
  [T in RenderedType]: {
    [_K in keyof MathItem<T>["properties"]]-?: Coverage;
  };
};
