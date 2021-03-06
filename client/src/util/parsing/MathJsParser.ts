import * as mjs from "mathjs";

import { adapter as msAdapter, MathNode } from "../MathScope";
import {
  IMathJsParser,
  MathJsRule,
  ParserRule,
  ParserRuleType,
  StrictRegepMatchArray,
  TextParserRegexRule,
  TextParserRule,
} from "./interfaces";

const isBeforeMathjsRule = (
  rule: ParserRule
): rule is TextParserRule | TextParserRegexRule => {
  if (rule.type === ParserRuleType.Text) return true;
  if (rule.type === ParserRuleType.TextRegexp) return true;
  return false;
};

const isMathJsRule = (rule: ParserRule): rule is MathJsRule => {
  return rule.type === ParserRuleType.MathJs;
};

/**
 * A parser that transforms strings into MathNodes for MathScope. The general
 * process is:
 *  1. pre-process the input string (string -> string) with user-provided rules.
 *    This is good for things like turning LaTeX fractions into normal division.
 *  2. parse with mathjs
 *  3. process the mathjs node (mjsNode -> mjsNode) with user-provided rules.
 *    This is good for things like simplifying the mjsNode or replacing unused
 *    operator functions (e.g., use `%` for cross product.)
 *
 * The parser accepts `ParserRule`s which determine its behavior. For example,
 * these can be used to
 */
class MathJsParser implements IMathJsParser {
  private rules: ParserRule[];

  constructor(rules: ParserRule[]) {
    this.rules = rules;
  }

  preprocess = (expression: string): string => {
    const textRules = this.rules.filter(isBeforeMathjsRule);
    const expressionFinal = textRules.reduce((text, rule) => {
      if (rule.type === ParserRuleType.Text) {
        return rule.transform(text);
      }
      return MathJsParser.applyTextRegexpRule(text, rule);
    }, expression);
    return expressionFinal;
  };

  mjsParse: IMathJsParser["mjsParse"] = (expression) => {
    const preprocessed = this.preprocess(expression);
    const mjsRules = this.rules.filter(isMathJsRule);
    return mjsRules.reduce(
      (mjsNode, rule) => rule.transform(mjsNode),
      mjs.parse(preprocessed)
    );
  };

  parse: IMathJsParser["parse"] = (expression, id, options): MathNode => {
    const mjsNode = this.mjsParse(expression);
    const node = msAdapter.convertNode(mjsNode, options) as MathNode;
    node.id = id;
    return node;
  };

  private static applyTextRegexpRule = (
    expr: string,
    rule: TextParserRegexRule
  ): string => {
    const { regexp, replacement } = rule;
    const matches = [
      ...expr.matchAll(regexp),
    ].reverse() as StrictRegepMatchArray[];
    return matches.reduce((text, match) => {
      return [
        text.slice(0, match.index),
        typeof replacement === "string" ? replacement : replacement(match),
        text.slice(match.index + match[0].length),
      ].join("");
    }, expr);
  };
}

export default MathJsParser;
