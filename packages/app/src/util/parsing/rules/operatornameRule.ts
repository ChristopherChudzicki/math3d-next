import { ParserRuleType, TextParserRegexRule } from "../interfaces";

/**
 * Replace "\operatorname{thing}" with "thing"
 */
const operatornameRule: TextParserRegexRule = {
  type: ParserRuleType.TextRegexp,
  regexp: /\\operatorname\{(?<name>\w*)\}/g,
  replacement: (match) => {
    const name = match.groups?.name;
    if (!name) {
      throw new Error(`Unexpected undefined name.`);
    }
    return name;
  },
};

export default operatornameRule;
