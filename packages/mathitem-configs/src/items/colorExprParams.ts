type SurfaceKind = "explicit" | "parametric" | "polar";

const DEFAULT_COLOR_RHS = "\\operatorname{mod}(\\operatorname{rescale}_z(z),1)";

/** Stands in for a coordinate whose name is taken; users can't define `$` names. */
const standIn = (coordinate: string) => `\\$${coordinate}`;

const layout = (kind: SurfaceKind) =>
  kind === "explicit"
    ? { coordinates: ["z"], surfaceStart: 0, coordinateStart: 2 }
    : { coordinates: ["x", "y", "z"], surfaceStart: 3, coordinateStart: 0 };

/**
 * A surface color function's parameters: the point's coordinates `x, y, z`
 * and the surface's own two parameters. An explicit surface's parameters are
 * its x and y, so it takes only `z` besides them.
 *
 * A coordinate becomes its stand-in `$c` when a surface parameter is named
 * `c`, or when `previous` has `$c` that no surface parameter explains: a
 * legacy scene's color expression that calls a global `c`.
 */
const colorExprParams = (
  kind: SurfaceKind,
  surfaceParams: string[],
  previous?: string[],
): string[] => {
  const { coordinates, surfaceStart, coordinateStart } = layout(kind);
  const taken = new Set(surfaceParams.map((p) => p.trim()));
  const previousTaken = new Set(
    (previous ?? []).slice(surfaceStart, surfaceStart + 2).map((p) => p.trim()),
  );
  const slots = coordinates.map((c, i) => {
    const wasLegacyStandIn =
      previous?.[coordinateStart + i] === standIn(c) && !previousTaken.has(c);
    return taken.has(c) || wasLegacyStandIn ? standIn(c) : c;
  });
  return kind === "explicit"
    ? [...surfaceParams, ...slots]
    : [...slots, ...surfaceParams];
};

export { colorExprParams, DEFAULT_COLOR_RHS };
