import type * as mjs from "mathjs";

import type { Parse } from "@math3d/mathscope";

// A parse-time validator. It runs the evaluated result through a check that
// throws on invalid input and otherwise returns the (possibly narrowed) value.
// Sourced from a math-item property config (`Validate<V>` in mathitem-configs,
// where the return is pinned to the property's EvaluatedProperties type) and
// attached to a parseable at sync time by syncMathScope — it is NOT part of the
// serialized item shape. Named `ParseValidate` to distinguish it from the
// stronger, generic `Validate<V>` in mathitem-configs. Return is `unknown`
// because the value flows on as the node's evaluated result.
type ParseValidate = (evaluated: unknown, parsed: mjs.MathNode) => unknown;
type ArrayValidate = (evaluated: unknown[], node: mjs.ArrayNode) => unknown;

// --- Serializable parseable shapes (the stored/wire form; no validators). ---
// These mirror the generated v1 client's value models, so the math-item
// property types that reference them stay structurally equal to the backend.
type ParseableObjs = {
  expr: {
    type: "expr";
    expr: string;
  };
  assignment: {
    type: "assignment";
    lhs: string;
    rhs: string;
  };
  "function-assignment": {
    type: "function-assignment";
    name: string;
    params: string[];
    rhs: string;
  };
  array: {
    type: "array";
    items: Parseable[];
  };
};

type ParseableObj = ParseableObjs[keyof ParseableObjs];
type Parseable = string | ParseableObj;
type ParseableArray<I extends Parseable = Parseable> = Omit<
  ParseableObjs["array"],
  "items"
> & {
  items: I[];
};

// --- Parse-time shapes: the serializable shapes plus the optional validator
// the parser reads. syncMathScope builds these by attaching a config validator
// to the stored (validate-free) parseable; the parser consumes them. Array
// `items` stay validate-free `Parseable` (only the top-level parseable for a
// property carries a validator), and a validate-free `Parseable` is assignable
// to `ValidatedParseable` since `validate` is optional. ---
type ValidatedParseableObjs = {
  expr: ParseableObjs["expr"] & { validate?: ParseValidate };
  assignment: ParseableObjs["assignment"] & { validate?: ParseValidate };
  "function-assignment": ParseableObjs["function-assignment"] & {
    validate?: ParseValidate;
  };
  array: ParseableObjs["array"] & { validate?: ArrayValidate };
};
type ValidatedParseableObj =
  ValidatedParseableObjs[keyof ValidatedParseableObjs];
type ValidatedParseable = string | ValidatedParseableObj;

enum ParserRuleType {
  MathJs = "mathjs",
  Text = "text",
  TextRegexp = "text-regexp",
}

interface TextParserRule {
  type: ParserRuleType.Text;
  transform: (text: string) => string;
}

interface MathJsRule {
  type: ParserRuleType.MathJs;
  transform: (node: mjs.MathNode) => mjs.MathNode;
}

type ParserRule = TextParserRule | MathJsRule;

interface IMathJsParser {
  preprocess: (text: string) => string;
  parse: Parse<ValidatedParseable>;
}

export { ParserRuleType };
export type {
  Parseable,
  ParseableObjs,
  ParseableArray,
  ValidatedParseable,
  ValidatedParseableObjs,
  IMathJsParser,
  MathJsRule,
  ParserRule,
  TextParserRule,
  ParseValidate,
};
