import type { GraphicSpec, ViewportSpec } from "@math3d/viewport-spec";

const stripped = new WeakMap<GraphicSpec, GraphicSpec>();

const strip = (spec: GraphicSpec): GraphicSpec => {
  if (spec.kind !== "implicit" || !spec.values) return spec;
  let copy = stripped.get(spec);
  if (!copy) {
    const { values, ...rest } = spec;
    copy = rest;
    stripped.set(spec, copy);
  }
  return copy;
};

/**
 * `spec` with no batched twins. A graphic keeps its identity while its spec
 * does, so a renderer still skips the ones that didn't change.
 */
export const withoutBatchedForms = (spec: ViewportSpec): ViewportSpec => ({
  ...spec,
  graphics: spec.graphics.map((graphic) => ({
    ...graphic,
    spec: strip(graphic.spec),
  })),
});
