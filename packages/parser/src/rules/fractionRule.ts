import { ParserRuleType, TextParserRule } from "../interfaces";
import { CommandReplacer, replaceAllTexCommand } from "./util";
import RegexpParserRule from "./RegexpParserRule";

const fractionReplacer: CommandReplacer = (frac) => {
  const [top, bottom] = frac.params;
  return `divide(${top}, ${bottom})`;
};

const fractionNormalizer = new RegexpParserRule(/\\frac(\d)(\d)/g, (match) => {
  const [_, top, bottom] = match;
  return `\\frac{${top}}{${bottom}}`;
});

/**
 * Transform LaTeX fractions to division, \frac{a+b}{x+y} --> ((a+b)/(x+y))
 */
const fractionRule: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text) => {
    const normalized = fractionNormalizer.transform(text);
    return replaceAllTexCommand(normalized, "frac", 2, fractionReplacer);
  },
};

export default fractionRule;
