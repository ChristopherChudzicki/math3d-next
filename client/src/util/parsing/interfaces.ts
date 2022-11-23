import type * as mjs from "mathjs";

import type { Parse } from "../MathScope";

type Validate = (evaluated: unknown, parsed: mjs.MathNode) => void;

type ParseableObjs = {
  expr: {
    type?: "expr";
    expr: string;
    validate?: Validate;
  };
  assignment: {
    type: "assignment";
    lhs: string;
    rhs: string;
    validate?: Validate;
  };
  "function-assignment": {
    type: "function-assignment";
    name: string;
    params: string[];
    rhs: string;
    validate?: Validate;
  };
  array: {
    type: "array";
    items: Parseable[];
    validate?: (evaluated: unknown[], node: mjs.ArrayNode) => void;
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

enum ParserRuleType {
  MathJs = "mathjs",
  Text = "text",
  TextRegexp = "text-regexp",
}

interface TextParserRule {
  type: ParserRuleType.Text;
  transform: (text: string) => string;
}

type StrictRegexpMatchArray = RegExpMatchArray & { index: number };

interface TextParserRegexRule {
  type: ParserRuleType.TextRegexp;
  regexp: RegExp;
  replacement: string | ((match: StrictRegexpMatchArray) => string);
}

interface MathJsRule {
  type: ParserRuleType.MathJs;
  transform: (node: mjs.MathNode) => mjs.MathNode;
}

type ParserRule = TextParserRule | TextParserRegexRule | MathJsRule;

interface IMathJsParser {
  preprocess: (text: string) => string;
  parse: Parse<Parseable>;
}

export { ParserRuleType };
export type {
  Parseable,
  ParseableObjs,
  ParseableArray,
  IMathJsParser,
  MathJsRule,
  ParserRule,
  StrictRegexpMatchArray,
  TextParserRegexRule,
  TextParserRule,
  Validate,
};
