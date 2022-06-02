import { findNestedExpression } from "./util";
import { ParserRuleType, TextParserRule } from "../interfaces";

const removeSubscriptBraces = (tex: string): string => {
  const sub = "_{";
  const subStart = tex.indexOf(sub);

  if (subStart < 0) {
    return tex;
  }

  const range = findNestedExpression(tex, "{", "}", subStart);
  if (!range) {
    throw new Error("Unexpected null range");
  }
  const replaced = [
    tex.slice(0, range.start),
    tex.slice(range.start + 1, range.end - 1),
    tex.slice(range.end),
  ].join("");

  return removeSubscriptBraces(replaced);
};

/**
 * Recursively removes braces from LaTeX subscripts
 *   - example: x_{12foo_{bar123_{evenlower}}} --> x_12foo_bar123_evenlower
 */
const subscriptRule: TextParserRule = {
  type: ParserRuleType.Text,
  transform: removeSubscriptBraces,
};

export default subscriptRule;
