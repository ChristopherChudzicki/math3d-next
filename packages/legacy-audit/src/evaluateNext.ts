/**
 * Legacy audit, pass 2a: evaluates one migrated scene in math3d-next
 * (docs/legacy-audit/2026-10-29-pass2-spec.md, "2a: math3d-next evaluator").
 * evaluateNext.spec.ts runs it over every scene.
 */
import type * as mjs from "mathjs";
import math from "@math3d/custom-mathjs";
import MathScope, { EvaluationError } from "@math3d/mathscope";
import type { IdentifiedParseable, MathNode } from "@math3d/mathscope";
import { latexParser } from "@math3d/parser";
import type { Parseable, ValidatedParseable } from "@math3d/parser";
import {
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
const builtins = new Set(
  Object.keys(
    // @ts-expect-error mathWithTransform is not in mathjs's types
    math.expression.mathWithTransform,
  ),
);

// Copied from app/src/store/scene/evaluation/syncMathScope.ts.
const MATH_WIDGETS = new Set([
  WidgetType.MathValue,
  WidgetType.MathAssignment,
  WidgetType.MathBoolean,
  WidgetType.CustomMath,
]);

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
            ? { expr: parseable, type: "expr" as const }
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
        // Graphics' own functions are named _f.
        if (!n.name.startsWith("_")) found.add("function_assignment");
      } else if (math.isRelationalNode(n)) {
        found.add("relational");
      } else if (math.isOperatorNode(n)) {
        if (RELATIONAL.has(n.fn)) found.add("relational");
        if (LOGICAL.has(n.fn)) found.add("logical");
        if (n.implicit) found.add("implicit_multiplication");
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

type Migrated = { items: MathItemPatch[] };
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
    const id = idOf.get(parseable as object)!;
    try {
      const node = latexParser.parse(parseable);
      parsed.set(id, node as MathNode);
      return node;
    } catch (err) {
      parseFailed.add(id);
      throw err;
    }
  };

  const scope = new MathScope<ValidatedParseable>({ parse, builtins });
  scope.setExpressions(
    expressions as IdentifiedParseable<ValidatedParseable>[],
  );

  const idsByName = new Map<string, string[]>();
  expressions.forEach(({ id, parseable }) => {
    const node = parsed.get(id);
    const name = node && "name" in node ? node.name : assignedName(parseable);
    if (name !== undefined) {
      idsByName.set(name, [...(idsByName.get(name) ?? []), id]);
    }
  });

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
      result.value = fingerprint(reportedValue(field, scope.results.get(id)));
    }
    if (typeof parseable === "object" && parseable.type === "array") {
      result.elements = elementResults(parseable.items, err, result.status);
    }
    out[itemId] ??= {};
    out[itemId][field] = result;
  });
  return out;
};

export { evaluateScene };
export type { FieldResult, SceneResult, Status };
