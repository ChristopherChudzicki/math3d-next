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
  realRootRule,
} from "./rules";

const cdotRule = new RegexpParserRule(/\\cdot/g, " * ");

// \div is the ÷ sign; without this rule it would become a call to `div`.
const divideRule = new RegexpParserRule(/\\div(?![a-zA-Z])/g, " / ");

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

// mathjs reads a number starting 0b, 0o or 0x as a binary, octal or hex
// literal; a space makes 0x the product 0·x, except inside a name like a_0x.
const zeroPrefixRule = new RegexpParserRule(
  /(?<![\p{L}\p{N}_$])0(?=[box])/gu,
  "0 ",
);

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
  divideRule,
  fenceLRule,
  brackRule,
  leftBraceRule,
  rightBraceRule,
  backslashRule,
  spaceRule,
  validateParameters,
  zeroPrefixRule,
  // MathJS rules
  pdiffRule,
  realRootRule,
  // simplifyRule,
];

const getLatexParser = () => new MathJsParser(parserRules);
const latexParser = getLatexParser();

export { getLatexParser, latexParser };
