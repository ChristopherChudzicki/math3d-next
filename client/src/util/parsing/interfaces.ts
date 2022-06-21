import type { MathNode as MJsNode } from "mathjs";

import type { Parse } from "../MathScope";
import type { ParseOptions } from "../MathScope/adapter";

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
  mjsParse: (text: string) => MJsNode;
  parse: Parse<ParseOptions>;
}

export { ParserRuleType };
export type {
  IMathJsParser,
  MathJsRule,
  ParserRule,
  StrictRegepMatchArray,
  TextParserRegexRule,
  TextParserRule,
};
