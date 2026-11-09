import { memoArgs } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { renderPoint } from "./point";
import { renderLine } from "./line";
import { renderSurface } from "./surface";
import { renderImplicitSurface } from "./implicitSurface";
import { renderAxis } from "./axis";
import { renderGrid } from "./grid";

type Renderers = {
  [K in GraphicSpec["kind"]]: (spec: GraphicSpec & { kind: K }) => LiveElement;
};

const renderers = {
  point: renderPoint,
  line: renderLine,
  surface: renderSurface,
  implicit: renderImplicitSurface,
  axis: renderAxis,
  grid: renderGrid,
} satisfies Renderers;

// Specs are immutable, so an unchanged spec reference means nothing to redo;
// without this memo every graphic (and every CPU sampler behind it) re-runs on
// any change anywhere in the scene.
export const renderGraphic = memoArgs((spec: GraphicSpec): LiveElement => {
  const render = renderers[spec.kind] as (spec: GraphicSpec) => LiveElement;
  return render(spec);
}, "renderGraphic");
