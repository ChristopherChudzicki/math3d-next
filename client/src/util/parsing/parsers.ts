import * as math from "mathjs";

import {
  MathJsRule,
  ParserRule,
  ParserRuleType,
  TextParserRegexRule,
} from "./interfaces";
import MathJsParser from "./MathJsParser";
import {
  fractionRule,
  operatornameRule,
  subscriptRule,
  validateAssignmentLHS,
} from "./rules";

const cdotRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\\cdot/g,
  replacement: " * ",
};

const fenceLRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\\left|\\right/g,
  replacement: "",
};

const leftBraceRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\{/g,
  replacement: "(",
};
const rightBraceRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\}/g,
  replacement: ")",
};

const spaceRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /[~\s]+/g,
  replacement: " ",
};

const backslashRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\\/g,
  replacement: " ",
};

const simplifyRule: MathJsRule = {
  type: ParserRuleType.MathJs,
  transform: (node) => {
    if (node.type === "FunctionAssignmentNode") {
      // eslint-disable-next-line no-param-reassign
      node.expr = math.simplify(node.expr);
    } else if (node.type === "AssignmentNode") {
      // eslint-disable-next-line no-param-reassign
      node.value = math.simplify(node.value);
    }
    return node;
  },
};

const parserRules: ParserRule[] = [
  fractionRule,
  subscriptRule,
  operatornameRule,
  cdotRule,
  fenceLRule,
  leftBraceRule,
  rightBraceRule,
  backslashRule,
  spaceRule,
  validateAssignmentLHS,
  // MathJS rules
  simplifyRule,
];

const getLatexParser = () => new MathJsParser(parserRules);
const latexParser = getLatexParser();

export { getLatexParser, latexParser };
