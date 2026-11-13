/**
 * Legacy audit, pass 2a: evaluates one migrated scene in math3d-next
 * (docs/legacy-audit/2026-10-29-pass2-spec.md, "2a: math3d-next evaluator").
 * evaluateNext.spec.ts runs it over every scene.
 */
import type * as mjs from "mathjs";
import math, { mathWithTransform } from "@math3d/custom-mathjs";
import MathScope, { EvaluationError } from "@math3d/mathscope";
import type { IdentifiedParseable, MathNode } from "@math3d/mathscope";
import { latexParser } from "@math3d/parser";
import type { Parseable, ValidatedParseable } from "@math3d/parser";
import {
  MathItemType,
  WidgetType,
  mathItemConfigs,
  type MathItemPatch,
} from "@math3d/mathitem-configs";
import { fingerprint, type Fingerprint } from "./fingerprint";

type ParseValidate = (value: unknown, node: mjs.MathNode) => unknown;
type Status = "ok" | "parse" | "eval" | "validate";
type FieldResult = {
  status: Status;
  message?: string;
  value?: Fingerprint;
  elements?: { status: Status; message?: string }[];
  deps: string[];
  features: string[];
};

// Thrown by a property's validator. EvaluationError subclasses pass through
// the parser's evaluate unchanged (parser/src/evaluate.ts); other errors are
// re-wrapped as plain EvaluationErrors, losing the stage.
class ValidateError extends EvaluationError {
  inner: Error;

  constructor(inner: Error) {
    super(inner.message);
    this.inner = inner;
  }
}

// Copied from app/src/store/scene/evaluation/mathScopeInstance.ts.
const builtins = new Set(Object.keys(mathWithTransform));

// Copied from app/src/store/scene/evaluation/syncMathScope.ts.
const MATH_WIDGETS = new Set([
  WidgetType.MathValue,
  WidgetType.MathAssignment,
  WidgetType.MathBoolean,
  WidgetType.CustomMath,
]);

// Copied from app/src/store/scene/evaluation/axisHelpers.ts.
const APP_OWNED_PREFIX = "app:";
const axisBoundName = (axis: string, bound: string) => `_${axis}_${bound}`;
const AXIS_HELPERS = ["x", "y", "z"].flatMap((axis) => {
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
    ...["min", "max"].map((bound) => ({
      id: `${APP_OWNED_PREFIX}${axis}_${bound}`,
      parseable: {
        type: "assignment" as const,
        lhs: `${axis}_${bound}`,
        rhs: axisBoundName(axis, bound),
      },
    })),
  ];
});

// syncMathScope's toParseableObj: an axis's min and max define `_x_min` etc.
const toParseableObj = (item: MathItemPatch, field: string, expr: string) => {
  const { axis } = item.properties as { axis?: string };
  if (item.type === MathItemType.Axis && (field === "min" || field === "max")) {
    if (!axis) {
      throw new Error("An axis's bounds sync together with its axis property.");
    }
    return {
      type: "assignment" as const,
      lhs: axisBoundName(axis, field),
      rhs: expr,
    };
  }
  return { expr, type: "expr" as const };
};

const wrapValidate = (validate?: ParseValidate) =>
  validate &&
  ((value: unknown, node: mjs.MathNode) => {
    try {
      return validate(value, node);
    } catch (err) {
      throw new ValidateError(err as Error);
    }
  });

// syncMathScope's getIdentifiedExpressions, with each validator wrapped.
const getIdentifiedExpressions = (items: MathItemPatch[]) =>
  items.flatMap((item) => {
    const config = mathItemConfigs[item.type];
    const properties = item.properties as Record<string, Parseable>;
    return Object.values(config.properties)
      .filter((prop) => MATH_WIDGETS.has(prop.widget))
      .filter((prop) => properties[prop.name] != null)
      .map((prop) => {
        const parseable = properties[prop.name];
        const parseableObj =
          typeof parseable === "string"
            ? toParseableObj(item, prop.name, parseable)
            : parseable;
        return {
          itemId: item.id,
          field: prop.name,
          id: `${item.id}-${prop.name}`,
          parseable: {
            ...parseableObj,
            validate: wrapValidate(prop.validate as ParseValidate),
          } as ValidatedParseable,
        };
      });
  });

const RELATIONAL = new Set([
  "equal",
  "unequal",
  "smaller",
  "larger",
  "smallerEq",
  "largerEq",
]);
const LOGICAL = new Set(["and", "or", "xor", "not"]);

const texts = (parseable: Parseable): string[] => {
  if (typeof parseable === "string") return [parseable];
  switch (parseable.type) {
    case "expr":
      return [parseable.expr];
    case "assignment":
      return [`${parseable.lhs}=${parseable.rhs}`];
    case "function-assignment":
      return [
        `${parseable.name}(${parseable.params.join(",")})=${parseable.rhs}`,
      ];
    default:
      return parseable.items.flatMap(texts);
  }
};

/** Whether `node` is a whole number as written, such as 2, -1 or (3). */
const isWholeLiteral = (node: mjs.MathNode): boolean => {
  if (math.isParenthesisNode(node)) return isWholeLiteral(node.content);
  if (math.isOperatorNode(node) && node.fn === "unaryMinus") {
    return isWholeLiteral(node.args[0]);
  }
  return math.isConstantNode(node) && Number.isInteger(node.value);
};

const features = (parseable: Parseable): string[] => {
  const found = new Set<string>();
  texts(parseable).forEach((text) => {
    let node: mjs.MathNode;
    try {
      node = math.parse(latexParser.preprocess(text));
    } catch {
      return;
    }
    node.traverse((n) => {
      if (math.isSymbolNode(n)) {
        // A builtin that is called, or used as a value as in diff(sin).
        if (builtins.has(n.name)) found.add(n.name);
      } else if (math.isIndexNode(n) && !n.dotNotation) {
        found.add("index");
      } else if (math.isRangeNode(n)) {
        found.add("range");
      } else if (math.isConditionalNode(n)) {
        found.add("conditional");
      } else if (math.isFunctionAssignmentNode(n)) {
        // Graphics' own functions (_f) start with _.
        if (!n.name.startsWith("_")) found.add("function_assignment");
      } else if (math.isRelationalNode(n)) {
        found.add("relational");
      } else if (math.isOperatorNode(n)) {
        if (RELATIONAL.has(n.fn)) found.add("relational");
        if (LOGICAL.has(n.fn)) found.add("logical");
        if (n.implicit) found.add("implicit_multiplication");
        if (n.fn === "pow" && !isWholeLiteral(n.args[1])) {
          found.add("nonwhole_pow");
        }
      }
    });
  });
  return [...found].sort();
};

const unwrap = (err: Error) => (err instanceof ValidateError ? err.inner : err);

const messages = (err: Error | undefined): string[] => {
  if (!err) return [];
  const e = unwrap(err);
  if (e instanceof AggregateError) {
    return e.errors.flatMap((inner: Error | undefined) => messages(inner));
  }
  const { lhs, rhs } = e as { lhs?: Error; rhs?: Error };
  if (lhs || rhs) return [...messages(lhs), ...messages(rhs)];
  return [e.message];
};

const message = (err: Error) => messages(err).join("; ") || err.message;

// A validator that calls the user's function (realFunc samples it) rethrows
// the function's own errors, which are EvaluationErrors.
const validatorStage = (err: Error): Status =>
  err instanceof EvaluationError ? "eval" : "validate";

const stage = (err: Error, parseFailed: boolean): Status => {
  if (parseFailed) return "parse";
  if (!(err instanceof ValidateError)) return "eval";
  const { inner } = err;
  if (inner instanceof AggregateError) {
    const failed: Error[] = inner.errors.filter(Boolean);
    return failed.every((e) => validatorStage(e) === "eval")
      ? "eval"
      : "validate";
  }
  return validatorStage(inner);
};

const elementResults = (
  items: unknown[],
  err: Error | undefined,
  status: Status,
) =>
  items.map((_item, i) => {
    if (!err) return { status: "ok" as const };
    const inner = unwrap(err);
    if (!(inner instanceof AggregateError)) {
      return { status, message: message(err) };
    }
    const e = inner.errors[i] as Error | undefined;
    if (!e) return { status: "ok" as const };
    return {
      status:
        status === "parse" || !(err instanceof ValidateError)
          ? status
          : validatorStage(e),
      message: message(e),
    };
  });

// A surface domain validates to {value: [f1, f2], order}; pass 1 checked
// `order`.
const reportedValue = (field: string, value: unknown) =>
  field === "domain" &&
  typeof value === "object" &&
  value !== null &&
  "order" in value &&
  "value" in value
    ? value.value
    : value;

// Park-Miller: realFunc validates at Math.random points.
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

// The name an assignment defines, even when its right-hand side doesn't
// parse, so that deps still point at it.
const assignedName = (parseable: ValidatedParseable): string | undefined => {
  if (
    typeof parseable !== "object" ||
    (parseable.type !== "assignment" &&
      parseable.type !== "function-assignment")
  ) {
    return undefined;
  }
  try {
    const node = latexParser.parse({
      ...parseable,
      rhs: "0",
      validate: undefined,
    } as ValidatedParseable);
    return "name" in node ? node.name : undefined;
  } catch {
    return parseable.type === "function-assignment"
      ? parseable.name
      : undefined;
  }
};

type Fn = (...args: unknown[]) => unknown;
const isFn = (value: unknown): value is Fn => typeof value === "function";

const SURFACES = new Set<string>([
  MathItemType.ParametricSurface,
  MathItemType.ExplicitSurfacePolar,
  MathItemType.ExplicitSurface,
]);

type ColorUse = {
  /** The axes whose rescale the body calls. */
  rescaled: Set<string>;
  /** Per explicit-surface parameter: whether the body uses it only inside its axis's rescale. */
  onlyRescaled: [boolean, boolean];
};

// What a translated color body says about the legacy one: math3d-react's X
// became rescale_x(<x slot>) (webserver/scenes/legacy_scene_utils/color_expr.py).
const colorUse = (parseable: Parseable): ColorUse => {
  const use: ColorUse = { rescaled: new Set(), onlyRescaled: [false, false] };
  if (
    typeof parseable !== "object" ||
    parseable.type !== "function-assignment"
  ) {
    return use;
  }
  const params = parseable.params.slice(0, 2).map((p) => p.trim());
  const inHelper = [false, false];
  const bare = [false, false];
  try {
    math
      .parse(latexParser.preprocess(parseable.rhs))
      .traverse((n, _path, parent) => {
        if (math.isFunctionNode(n)) {
          const match = /^rescale_([xyz])$/.exec(n.fn.toString());
          if (match) use.rescaled.add(match[1]);
        }
        if (!math.isSymbolNode(n)) return;
        const i = params.indexOf(n.name);
        if (i < 0) return;
        const helper = `rescale_${"xy"[i]}`;
        if (math.isFunctionNode(parent) && parent.fn.toString() === helper) {
          inHelper[i] = true;
        } else {
          bare[i] = true;
        }
      });
  } catch {
    return use;
  }
  use.onlyRescaled = [inHelper[0] && !bare[0], inHelper[1] && !bare[1]];
  return use;
};

/**
 * math3d-react's surface color expressions take the point's coordinates
 * normalized to [0, 1], X, Y, Z, then the surface's parameters; math3d-next's
 * take coordinates. This calls next's with react's arguments, so both are
 * sampled at the same points.
 */
const legacyColorLayout = (
  type: string,
  fn: Fn,
  use: ColorUse,
  bounds: unknown[][],
): Fn => {
  const { add, multiply, subtract } = math as unknown as Record<string, Fn>;
  // A slot is read only inside its axis's rescale, which errors anyway when
  // that axis's bounds failed, so the sample passes through.
  const raw = (i: number, t: unknown) => {
    const [min, max] = bounds[i];
    if (min === undefined || max === undefined) return t;
    return add(min, multiply(t, subtract(max, min)));
  };
  if (type !== MathItemType.ExplicitSurface) {
    return (X, Y, Z, u, v) => fn(raw(0, X), raw(1, Y), raw(2, Z), u, v);
  }
  // An explicit surface's x and y are its parameters, which react's X and Y
  // match on screen but not at the audit's independent sample points. A body
  // using a parameter both bare and rescaled can't match both, so it differs.
  const [fromX, fromY] = use.onlyRescaled;
  return (X, Y, Z, x, y) =>
    fn(fromX ? raw(0, X) : x, fromY ? raw(1, Y) : y, raw(2, Z));
};

// Both apps divide by a flat axis's width of 0, but the audit's free X, Y, Z
// can't be mapped back onto it, so the color isn't sampled.
const rescalesFlatAxis = (use: ColorUse, bounds: unknown[][]) =>
  [...use.rescaled].some((axis) => {
    const [min, max] = bounds["xyz".indexOf(axis)];
    return typeof min === "number" && min === max;
  });

type Migrated = { items: MathItemPatch[] };

/** Whether any of the scene's math fields has one of `wanted` as a feature. */
const usesAny = (migrated: Migrated, wanted: string[]): boolean =>
  getIdentifiedExpressions(migrated.items).some(({ parseable }) =>
    features(parseable).some((f) => wanted.includes(f)),
  );

type SceneResult = Record<string, Record<string, FieldResult>>;

/**
 * Evaluates a migrated scene as the app does, reporting each math field's
 * status, value fingerprint, dependencies and features. Seeds Math.random,
 * which the caller restores.
 */
const evaluateScene = (migrated: Migrated): SceneResult => {
  Math.random = seededRandom(1);
  // The app's keyBy: the last item with an id wins.
  const items = [...new Map(migrated.items.map((i) => [i.id, i])).values()];
  const expressions = getIdentifiedExpressions(items);

  const idOf = new WeakMap<object, string>();
  expressions.forEach((e) => idOf.set(e.parseable as object, e.id));
  const parsed = new Map<string, MathNode>();
  const parseFailed = new Set<string>();
  const parse = (parseable: ValidatedParseable) => {
    const id = idOf.get(parseable as object);
    if (id === undefined) return latexParser.parse(parseable);
    try {
      const node = latexParser.parse(parseable);
      parsed.set(id, node as MathNode);
      return node;
    } catch (err) {
      parseFailed.add(id);
      throw err;
    }
  };

  const scope = new MathScope<ValidatedParseable>({
    parse,
    builtins,
    isOverridable: (id) => id.startsWith(APP_OWNED_PREFIX),
  });
  scope.setExpressions([
    ...(AXIS_HELPERS as IdentifiedParseable<ValidatedParseable>[]),
    ...(expressions as IdentifiedParseable<ValidatedParseable>[]),
  ]);

  const idsByName = new Map<string, string[]>();
  expressions.forEach(({ id, parseable }) => {
    const node = parsed.get(id);
    const name = node && "name" in node ? node.name : assignedName(parseable);
    if (name !== undefined) {
      idsByName.set(name, [...(idsByName.get(name) ?? []), id]);
    }
  });
  // An axis helper's dependents depend on its axis's bounds.
  ["x", "y", "z"].forEach((axis) => {
    const bounds = ["min", "max"].flatMap(
      (bound) => idsByName.get(axisBoundName(axis, bound)) ?? [],
    );
    [`rescale_${axis}`, `${axis}_min`, `${axis}_max`].forEach((name) => {
      if (!idsByName.has(name)) idsByName.set(name, bounds);
    });
  });
  // _x_min etc., which rescale_x reads, not x_min, which a user can override.
  const axisBounds = ["x", "y", "z"].map((axis) =>
    ["min", "max"].map((bound) => {
      const ids = idsByName.get(axisBoundName(axis, bound)) ?? [];
      return ids.length === 1 ? scope.results.get(ids[0]) : undefined;
    }),
  );
  const typeOf = new Map(items.map((i) => [i.id, i.type]));

  const out: SceneResult = {};
  expressions.forEach(({ itemId, field, id, parseable }) => {
    const node = parsed.get(id);
    const result: FieldResult = {
      status: "ok",
      deps: node
        ? [...node.dependencies].flatMap((name) => idsByName.get(name) ?? [])
        : [],
      features: features(parseable),
    };
    const err = scope.errors.get(id);
    if (err) {
      result.status = stage(err, parseFailed.has(id));
      result.message = message(err);
    } else {
      const value = reportedValue(field, scope.results.get(id));
      const type = typeOf.get(itemId);
      if (field === "colorExpr" && type && SURFACES.has(type) && isFn(value)) {
        const use = colorUse(parseable);
        result.value = rescalesFlatAxis(use, axisBounds)
          ? { fn: 5, at: null, flat_axis: true }
          : fingerprint(legacyColorLayout(type, value, use, axisBounds));
      } else {
        result.value = fingerprint(value);
      }
    }
    if (typeof parseable === "object" && parseable.type === "array") {
      result.elements = elementResults(parseable.items, err, result.status);
    }
    out[itemId] ??= {};
    out[itemId][field] = result;
  });
  return out;
};

export { evaluateScene, usesAny };
