import RegexpParserRule from "./RegexpParserRule";

/**
 * Replace "\operatorname{thing}" with "thing"
 */
const operatornameRule = new RegexpParserRule(
  /\\operatorname\{(?<name>\w*)\}/g,
  (match) => {
    const name = match.groups?.name;
    if (!name) {
      throw new Error(`Unexpected undefined name.`);
    }
    return name;
  },
);

export default operatornameRule;
