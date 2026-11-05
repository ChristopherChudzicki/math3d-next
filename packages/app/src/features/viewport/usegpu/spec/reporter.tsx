import React from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathGraphic, MathGraphicType } from "@math3d/mathitem-configs";
import type { SpecComponent } from "./collector";
import Point from "./point";
import { Line, ParametricCurve } from "./line";
import Surface from "./surface";
import ImplicitSurface from "./implicitSurface";
import Axis from "./axis";
import Grid from "./grid";

const notDrawnYet: SpecComponent<MIT.Vector | MIT.VectorField> = () => null;

const reporters = {
  [MIT.Point]: Point,
  [MIT.Line]: Line,
  [MIT.ParametricCurve]: ParametricCurve,
  [MIT.ParametricSurface]: Surface,
  [MIT.ExplicitSurface]: Surface,
  [MIT.ExplicitSurfacePolar]: Surface,
  [MIT.ImplicitSurface]: ImplicitSurface,
  [MIT.Axis]: Axis,
  [MIT.Grid]: Grid,
  [MIT.Vector]: notDrawnYet,
  [MIT.VectorField]: notDrawnYet,
} satisfies { [T in MathGraphicType]: SpecComponent<T> };

/** Reports `item`'s `GraphicSpec` to the enclosing `SpecCollector`. */
export const GraphicSpecReporter: React.FC<{ item: MathGraphic }> = React.memo(
  ({ item }) => {
    // @ts-expect-error (reporter, item) are not correlated.
    const Reporter: SpecComponent<MathGraphicType> = reporters[item.type];
    return <Reporter item={item} />;
  },
);
GraphicSpecReporter.displayName = "GraphicSpecReporter";
