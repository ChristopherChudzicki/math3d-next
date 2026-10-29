/**
 * Legacy audit, pass 2a: evaluates every migrated scene in math3d-next
 * (docs/legacy-audit/2026-10-29-pass2-spec.md, "2a: math3d-next evaluator").
 *
 * Input: LEGACY_EVAL_NEXT_IN, legacy.jsonl from export_legacy_audit. Output:
 * LEGACY_EVAL_NEXT_OUT, one line per input line. LEGACY_EVAL_NEXT_LIMIT stops
 * after that many scenes.
 *
 * Skipped unless LEGACY_EVAL_NEXT_IN and LEGACY_EVAL_NEXT_OUT are set.
 */
import * as fs from "node:fs";
import * as readline from "node:readline";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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

const input = process.env.LEGACY_EVAL_NEXT_IN;
const output = process.env.LEGACY_EVAL_NEXT_OUT;
const limit = Number(process.env.LEGACY_EVAL_NEXT_LIMIT ?? Infinity);

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
      if (math.isFunctionNode(n) && math.isSymbolNode(n.fn)) {
        if (builtins.has(n.fn.name)) found.add(n.fn.name);
      } else if (math.isIndexNode(n) && !n.dotNotation) {
        found.add("index");
      } else if (math.isRangeNode(n)) {
        found.add("range");
      } else if (math.isConditionalNode(n)) {
        found.add("conditional");
      } else if (math.isFunctionAssignmentNode(n)) {
        found.add("function_assignment");
      } else if (math.isOperatorNode(n)) {
        if (RELATIONAL.has(n.fn)) found.add("relational");
        if (LOGICAL.has(n.fn)) found.add("logical");
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

const stage = (err: Error, parseFailed: boolean): Status => {
  if (parseFailed) return "parse";
  return err instanceof ValidateError ? "validate" : "eval";
};

const message = (err: Error) => messages(err).join("; ") || err.message;

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

type Migrated = { items: MathItemPatch[] };

const evaluateScene = (migrated: Migrated) => {
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
  parsed.forEach((node, id) => {
    if ("name" in node) {
      idsByName.set(node.name, [...(idsByName.get(node.name) ?? []), id]);
    }
  });

  const out: Record<string, Record<string, FieldResult>> = {};
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
      const inner = err && unwrap(err);
      result.elements = parseable.items.map((_item, i) => {
        if (!err) return { status: "ok" };
        if (inner instanceof AggregateError) {
          const e = inner.errors[i] as Error | undefined;
          return e
            ? { status: result.status, message: message(e) }
            : { status: "ok" };
        }
        return { status: result.status, message: result.message };
      });
    }
    out[itemId] ??= {};
    out[itemId][field] = result;
  });
  return out;
};

describe.skipIf(!input || !output)("legacy evaluation, math3d-next", () => {
  const { random } = Math;
  beforeAll(() => {
    // parser/src/evaluate.ts warns on every mathjs error.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterAll(() => {
    Math.random = random;
    vi.restoreAllMocks();
  });

  it("evaluates every scene", async () => {
    const fd = fs.openSync(output!, "w");
    const lines = readline.createInterface({
      input: fs.createReadStream(input!),
      crlfDelay: Infinity,
    });
    const start = Date.now();
    let count = 0;
    let crashes = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of lines) {
      if (count >= limit) break;
      if (line) {
        const scene = JSON.parse(line);
        let record: object;
        try {
          record = scene.migrate_error
            ? { crashed: `migrate_error: ${scene.migrate_error}`, items: {} }
            : { crashed: null, items: evaluateScene(scene.migrated) };
        } catch (err) {
          crashes += 1;
          record = { crashed: (err as Error).message, items: {} };
        }
        fs.writeSync(
          fd,
          `${JSON.stringify({ version: 2, key: scene.key, ...record })}\n`,
        );
        count += 1;
        if (count % 1000 === 0) {
          process.stderr.write(
            `${count} scenes, ${((Date.now() - start) / 1000).toFixed(0)}s\n`,
          );
        }
      }
    }
    fs.closeSync(fd);
    process.stderr.write(
      `done: ${count} scenes, ${crashes} crashed, ${((Date.now() - start) / 1000).toFixed(1)}s\n`,
    );
    expect(count).toBeGreaterThan(0);
  }, 3_600_000);
});
