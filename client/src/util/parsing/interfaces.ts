import { MathNode as MJsNode } from "mathjs";

import type { Parse } from "../MathScope";

type Validate = (evaluated: unknown, parsed: math.MathNode) => void;

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
  array: {
    type: "array";
    items: Parseable[];
    validate?: (evaluated: unknown[]) => void;
  };
};

type ParseableObj = ParseableObjs[keyof ParseableObjs];
type Parseable = string | ParseableObj;

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
  transform: (node: MJsNode) => MJsNode;
}

type ParserRule = TextParserRule | TextParserRegexRule | MathJsRule;

interface IMathJsParser {
  preprocess: (text: string) => string;
  parse: Parse<Parseable>;
}

interface IBatchErrorCtor {
  new (errors: Record<number, Error>): IBatchError;
}
interface IBatchError extends Error {
  errors: Record<number, Error>;
}

export { ParserRuleType };
export type {
  Parseable,
  ParseableObjs,
  IMathJsParser,
  MathJsRule,
  ParserRule,
  StrictRegexpMatchArray,
  TextParserRegexRule,
  TextParserRule,
  Validate,
  IBatchError,
  IBatchErrorCtor,
};
