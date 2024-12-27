import math from "@math3d/custom-mathjs";

import { MathJsRule, ParserRule, ParserRuleType } from "./interfaces";
import MathJsParser from "./MathJsParser";
import {
  RegexpParserRule,
  pdiffRule,
  fractionRule,
  decorativeTextRule,
  validateParameters,
  subscriptRule,
  exponentRule,
} from "./rules";

const cdotRule = new RegexpParserRule(/\\cdot/g, " * ");

const fenceLRule = new RegexpParserRule(/\\left|\\right/g, "");

const brackRule = new RegexpParserRule(/\\(?<side>[lr])brack/g, (match) => {
  if (match.groups?.side === "l") return "[";
  if (match.groups?.side === "r") return "]";
  throw new Error("Unexpected: Side not matched.");
});

const leftBraceRule = new RegexpParserRule(/\{/g, "(");
const rightBraceRule = new RegexpParserRule(/\}/g, ")");

const spaceRule = new RegexpParserRule(/[~\s]+/g, " ");

const backslashRule = new RegexpParserRule(/\\/g, " ");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const simplifyRule: MathJsRule = {
  type: ParserRuleType.MathJs,
  transform: (node) => {
    if (math.isFunctionAssignmentNode(node)) {
      // eslint-disable-next-line no-param-reassign
      node.expr = math.simplify(node.expr);
    } else if (math.isAssignmentNode(node)) {
      // eslint-disable-next-line no-param-reassign
      node.value = math.simplify(node.value);
    }
    return node;
  },
};

const parserRules: ParserRule[] = [
  fractionRule,
  exponentRule,
  subscriptRule,
  decorativeTextRule,
  cdotRule,
  fenceLRule,
  brackRule,
  leftBraceRule,
  rightBraceRule,
  backslashRule,
  spaceRule,
  validateParameters,
  // MathJS rules
  pdiffRule,
  // simplifyRule,
];

const getLatexParser = () => new MathJsParser(parserRules);
const latexParser = getLatexParser();

export { getLatexParser, latexParser };
