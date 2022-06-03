import * as math from "mathjs";
import { subscriptRule, fractionRule, operatornameRule } from "./rules";
import MathJsParser from "./MathJsParser";
import {
  ParserRuleType,
  TextParserRegexRule,
  ParserRule,
  MathJsRule,
} from "./interfaces";

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
  // MathJS rules
  simplifyRule,
];

const latexParser = new MathJsParser(parserRules);

export { latexParser };
