import { parse as mjsParse } from "mathjs";
import { latexParser } from "./parsers";
/**
 * This file includes helpers for parsing mathematical expressions, not
 * necessarily related to the MathScope adapter.
 */

const splitAtFirstEquality = (text: string): [string, string] => {
  const pieces = text.split("=");
  if (pieces.length < 2) {
    // They should have eactly one, but if they have more, that's an issue for the parser
    throw new Error(`Fatal error: Assignments should have an equality sign.`);
  }
  const [lhs, ...others] = pieces;
  const rhs = others.join("=");
  return [lhs, rhs];
};

const getParameters = (expr: string): string[] => {
  /**
   * Expr should parse to a FunctionAssignmentNode, but let's discard the RHS
   * and use LHS = 1 in case the RHS includes a parsing error.
   */
  const [lhs] = splitAtFirstEquality(expr);
  const node = latexParser.mjsParse(`${lhs} = 1`);
  if (node.type !== "FunctionAssignmentNode") {
    throw new Error("Expected a FunctionAssignmentNode");
  }
  return node.params;
};

export { splitAtFirstEquality, getParameters };
