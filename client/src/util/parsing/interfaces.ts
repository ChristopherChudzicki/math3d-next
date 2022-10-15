import type { MathNode as MJsNode } from "mathjs";

import type { Parse } from "../MathScope";

type Validate = (evaluated: unknown, parsed: math.MathNode) => void;

type ParseableObj = { expr: string; validate?: Validate };
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

type StrictRegepMatchArray = RegExpMatchArray & { index: number };

interface TextParserRegexRule {
  type: ParserRuleType.TextRegexp;
  regexp: RegExp;
  replacement: string | ((match: StrictRegepMatchArray) => string);
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

export { ParserRuleType };
export type {
  Parseable,
  IMathJsParser,
  MathJsRule,
  ParserRule,
  StrictRegepMatchArray,
  TextParserRegexRule,
  TextParserRule,
  Validate,
};
