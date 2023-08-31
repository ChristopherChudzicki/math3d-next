import RegexpParserRule from "./RegexpParserRule";

const exponentRule = new RegexpParserRule(
  /\^(\w)/g,
  (match) => `^(${match[1]})`
);

export default exponentRule;
