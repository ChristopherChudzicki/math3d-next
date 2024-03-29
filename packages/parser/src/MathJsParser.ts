import type * as mjs from "mathjs";
import math from "@math3d/custom-mathjs";

import {
  SimplerMathJsParser,
  AnonMathNode,
  AssignmentError,
  MathNodeType,
} from "@math3d/mathscope";
import { aggregate } from "@math3d/utils";
import invariant from "tiny-invariant";
import { getValidatedEvaluate } from "./evaluate";
import {
  IMathJsParser,
  MathJsRule,
  Parseable,
  ParseableObjs,
  ParserRule,
  ParserRuleType,
  TextParserRule,
} from "./interfaces";

const mjsAdapter = new SimplerMathJsParser(math);

const isBeforeMathjsRule = (rule: ParserRule): rule is TextParserRule => {
  if (rule.type === ParserRuleType.Text) return true;
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
      return rule.transform(text);
    }, expression);
    return expressionFinal;
  };

  private mjsParse = (preprocessed: string) => {
    const mjsRules = this.rules.filter(isMathJsRule);
    return mjsRules.reduce(
      (mjsNode, rule) => rule.transform(mjsNode),
      math.parse(preprocessed),
    );
  };

  private parseAssignment = ({
    lhs,
    rhs,
    validate,
  }: Omit<ParseableObjs["assignment"], "type">): readonly [
    AnonMathNode,
    mjs.MathNode,
  ] => {
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
      invariant(err instanceof Error);
      rhsError = err;
    }
    if (lhsError || rhsError) {
      throw new DetailedAssignmentError("Invalid assignment", {
        lhs: lhsError,
        rhs: rhsError,
      });
    }

    const expr = `${lhs}=${rhs}`;

    return this.$parse({ expr, validate, type: "expr" });
  };

  private parseFunctionAssignment = ({
    name,
    params,
    rhs,
    validate,
  }: Omit<ParseableObjs["function-assignment"], "type">): readonly [
    AnonMathNode,
    mjs.MathNode,
  ] => {
    const lhs = `${name}(${params.join(",")})`;
    return this.parseAssignment({ lhs, rhs, validate });
  };

  private parseArray = ({
    items,
    validate,
  }: ParseableObjs["array"]): readonly [AnonMathNode, mjs.MathNode] => {
    const parsed = aggregate(items, (item) => this.$parse(item));
    const nodes = parsed.map((p) => p[0]);
    const mjsNodes = parsed.map((p) => p[1]);
    const mjsNode = new math.ArrayNode(mjsNodes);
    return [
      MathJsParser.aggregateNodes(nodes, mjsNode, validate),
      mjsNode,
    ] as const;
  };

  private $parse = (
    parseable: Parseable,
  ): readonly [AnonMathNode, mjs.MathNode] => {
    const parseableObj: Parseable =
      typeof parseable === "string"
        ? { expr: parseable, type: "expr" }
        : parseable;
    if (parseableObj.type === "assignment") {
      return this.parseAssignment(parseableObj);
    }
    if (parseableObj.type === "function-assignment") {
      return this.parseFunctionAssignment(parseableObj);
    }
    if (parseableObj.type === "array") {
      return this.parseArray(parseableObj);
    }
    const preprocessed = this.preprocess(parseableObj.expr);
    const mjsNode = this.mjsParse(preprocessed);
    const evaluate = getValidatedEvaluate(mjsNode, parseableObj.validate);
    const node = mjsAdapter.convertNode(mjsNode, evaluate);
    return [node, mjsNode];
  };

  parse: IMathJsParser["parse"] = (parseable) => {
    return this.$parse(parseable)[0];
  };

  private static aggregateNodes = (
    nodes: AnonMathNode[],
    mjsNode: mjs.ArrayNode,
    validate: NonNullable<ParseableObjs["array"]["validate"]> = (x) => x,
  ): AnonMathNode => {
    const evaluate: AnonMathNode["evaluate"] = (scope) => {
      const result = aggregate(nodes, (node) => node.evaluate(scope));
      return validate(result, mjsNode);
    };
    const dependencies = new Set(
      nodes.flatMap((node) => [...node.dependencies]),
    );

    return {
      type: MathNodeType.Value,
      evaluate,
      dependencies,
    };
  };
}

export default MathJsParser;
export { DetailedAssignmentError };
