import { ParserRuleType, TextParserRule } from "../interfaces";
import { FUNCTION_ARITY } from "./functionNames";

const names = Object.keys(FUNCTION_ARITY).join("|");
// Only before a digit, letter or command: `\log_2`, `\sin(` and
// `t_{\operatorname{max}}` stay as they are.
const commandRegex = new RegExp(String.raw`\\(?:${names})(?=[0-9\\])`, "g");
const operatornameRegex = new RegExp(
  String.raw`\\operatorname\{(?:${names}|\\mathrm\{(?:${names})\})\}(?=[0-9a-zA-Z\\])`,
  "g",
);

/**
 * Space a function command off from what follows, so `\sin2x` and
 * `\operatorname{abs}x` don't read as single names `sin2x` and `absx`.
 */
const functionCommandSpacingRule: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text) =>
    text
      .replace(commandRegex, (match) => `${match} `)
      .replace(operatornameRegex, (match) => `${match} `),
};

export default functionCommandSpacingRule;
