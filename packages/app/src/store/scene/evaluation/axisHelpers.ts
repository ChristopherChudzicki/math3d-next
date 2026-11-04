import type { IdentifiedParseable } from "@math3d/mathscope";
import type { ParseableObjs } from "@math3d/parser";

/**
 * Id prefix of the app's own scope definitions. A user's definition of the
 * same name overrides them.
 */
const APP_OWNED_PREFIX = "builtin:";

const AXES = ["x", "y", "z"] as const;
const BOUNDS = ["min", "max"] as const;

/** Each axis's bound as the axis item defines it, e.g. `_x_min`. */
const axisBoundName = (axis: string, bound: string) => `_${axis}_${bound}`;

/**
 * `rescale_x(t)` maps t to [0, 1] across the x axis's range; `x_min` and
 * `x_max` are its bounds. Likewise for y and z.
 * They read `_x_min` etc., which each axis item's min and max define.
 */
const AXIS_HELPERS: IdentifiedParseable<
  ParseableObjs["function-assignment"] | ParseableObjs["assignment"]
>[] = AXES.flatMap((axis) => {
  const min = axisBoundName(axis, "min");
  const max = axisBoundName(axis, "max");
  return [
    {
      id: `${APP_OWNED_PREFIX}rescale_${axis}`,
      parseable: {
        type: "function-assignment" as const,
        name: `rescale_${axis}`,
        params: ["t"],
        rhs: `(t-${min})/(${max}-${min})`,
      },
    },
    ...BOUNDS.map((bound) => ({
      id: `${APP_OWNED_PREFIX}${axis}_${bound}`,
      parseable: {
        type: "assignment" as const,
        lhs: `${axis}_${bound}`,
        rhs: axisBoundName(axis, bound),
      },
    })),
  ];
});

export { APP_OWNED_PREFIX, AXIS_HELPERS, axisBoundName };
