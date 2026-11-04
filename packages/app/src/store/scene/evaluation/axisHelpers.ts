import type { IdentifiedParseable } from "@math3d/mathscope";
import type { ParseableObjs } from "@math3d/parser";

/** Ids of the scope definitions the app owns; a user's definition overrides them. */
const APP_OWNED_PREFIX = "builtin:";

const AXES = ["x", "y", "z"] as const;
const BOUNDS = ["min", "max"] as const;

/** Each axis's bound as the axis item defines it, e.g. `_x_min`. */
const axisBoundName = (axis: string, bound: string) => `_${axis}_${bound}`;

const APP_OWNED_NAMES: ReadonlySet<string> = new Set([
  ...AXES.map((axis) => `rescale_${axis}`),
  ...AXES.flatMap((axis) => BOUNDS.map((bound) => `${axis}_${bound}`)),
]);

const DEFAULT_BOUNDS = { min: "-1", max: "1" };

/**
 * `rescale_x(t)` maps t to [0, 1] across the x axis's range; `x_min` and
 * `x_max` are its bounds. Likewise for y and z.
 *
 * Each axis item's min and max define `_x_min` etc. and override the defaults
 * here, which match the range the viewport draws without an axis item.
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
      id: `${APP_OWNED_PREFIX}${axisBoundName(axis, bound)}`,
      parseable: {
        type: "assignment" as const,
        lhs: axisBoundName(axis, bound),
        rhs: DEFAULT_BOUNDS[bound],
      },
    })),
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

export { APP_OWNED_PREFIX, APP_OWNED_NAMES, AXIS_HELPERS, axisBoundName };
