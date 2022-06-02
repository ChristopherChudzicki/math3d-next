import { CommandReplacer, replaceAllTexCommand } from "./util";
import { ParserRuleType, TextParserRule } from "../interfaces";

const fractionReplacer: CommandReplacer = (frac) => {
  const [top, bottom] = frac.params;
  return `(${top})/(${bottom})`;
};

/**
 * Transform LaTeX fractions to division, \frac{a+b}{x+y} --> ((a+b)/(x+y))
 */
const fractionRule: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text) => replaceAllTexCommand(text, "frac", 2, fractionReplacer),
};

export default fractionRule;
