import * as mjs from "mathjs";

import { adapter as msAdapter, AssignmentError } from "@/util/MathScope";
import { assertInstanceOf } from "@/util/predicates";
import { getValidatedEvaluate } from "./evaluate";
import {
  IMathJsParser,
  MathJsRule,
  ParseableObjs,
  ParserRule,
  ParserRuleType,
  StrictRegexpMatchArray,
  TextParserRegexRule,
  TextParserRule,
} from "./interfaces";
import { ArrayParseError, batch, batchNodes } from "./batch";

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

class DetailedAssignmentError extends Error {
  lhs?: Error;

  rhs?: Error;

  constructor(msg: string, { lhs, rhs }: { lhs?: Error; rhs?: Error }) {
    super(msg);
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

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

  private mjsParse = (preprocessed: string) => {
    const mjsRules = this.rules.filter(isMathJsRule);
    return mjsRules.reduce(
      (mjsNode, rule) => rule.transform(mjsNode),
      mjs.parse(preprocessed)
    );
  };

  private parseAssignment = ({
    lhs,
    rhs,
    validate,
  }: ParseableObjs["assignment"]) => {
    let lhsError: Error | undefined;
    let rhsError: Error | undefined;
    try {
      this.parse(`${lhs} = 0`);
    } catch (err) {
      if (err instanceof AssignmentError) {
        lhsError = err;
      } else {
        lhsError = new AssignmentError("Invalid left-hand side.");
      }
    }
    try {
      this.parse(`x = ${rhs}`);
    } catch (err) {
      assertInstanceOf(err, Error);
      rhsError = err;
    }
    if (lhsError || rhsError) {
      throw new DetailedAssignmentError("Invalid assignment", {
        lhs: lhsError,
        rhs: rhsError,
      });
    }

    const expr = `${lhs}=${rhs}`;

    return this.parse({ expr, validate });
  };

  private parseArray = ({ items }: ParseableObjs["array"]) => {
    const parsed = batch(items, (item) => this.parse(item), ArrayParseError);
    return batchNodes(parsed);
  };

  parse: IMathJsParser["parse"] = (parseable) => {
    const parseableObj =
      typeof parseable === "string" ? { expr: parseable } : parseable;
    if (parseableObj.type === "assignment") {
      return this.parseAssignment(parseableObj);
    }
    if (parseableObj.type === "array") {
      return this.parseArray(parseableObj);
    }
    const preprocessed = this.preprocess(parseableObj.expr);
    const mjsNode = this.mjsParse(preprocessed);
    const evaluate = getValidatedEvaluate(mjsNode, parseableObj.validate);
    const node = msAdapter.convertNode(mjsNode, evaluate);
    return node;
  };

  private static applyTextRegexpRule = (
    expr: string,
    rule: TextParserRegexRule
  ): string => {
    const { regexp, replacement } = rule;
    const matches = [
      ...expr.matchAll(regexp),
    ].reverse() as StrictRegexpMatchArray[];
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
export { DetailedAssignmentError };
