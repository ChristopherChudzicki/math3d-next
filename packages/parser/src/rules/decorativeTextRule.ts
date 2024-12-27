import { ParserRuleType, TextParserRule } from "../interfaces";
import { replaceAllTexCommand } from "./util";

const commands = ["operatorname", "mathrm"];

/**
 * Transform LaTeX fractions to division, \frac{a+b}{x+y} --> ((a+b)/(x+y))
 */
const fractionRule: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text) => {
    return commands.reduce((acc, command) => {
      const normalized = replaceAllTexCommand(acc, command, 1, (match) => {
        return match.params[0];
      });
      return normalized;
    }, text);
  },
};

export default fractionRule;
