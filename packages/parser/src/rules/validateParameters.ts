import math from "@math3d/custom-mathjs";
import countBy from "lodash/countBy";
import pickBy from "lodash/pickBy";
import { AssignmentError } from "@math3d/mathscope";
import { ParserRuleType, TextParserRule } from "../interfaces";

const FUNCTION_ASSIGNMENT_REGEX = /\((?<params>.*?)\)[^><=]?\s*=\s*[^><=]?/;
const isSymbolString = (s: string) => {
  try {
    return math.parse(s).type === "SymbolNode";
  } catch (err) {
    return false;
  }
};

class ParameterErrors extends AssignmentError {
  paramErrors: Record<number, Error>;

  constructor(msg: string, paramErrors: Record<number, Error> = {}) {
    super(msg);
    this.paramErrors = paramErrors;
  }
}

/**
 * Validate parameters in a function assignment are valid names
 */
const validateParameters: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text: string): string => {
    const match = text.match(FUNCTION_ASSIGNMENT_REGEX);
    if (!match?.groups?.params) return text;
    if (match.groups.params.trim() === "") return text;
    const params = match.groups.params.split(",").map((p) => p.trim());
    const invalidEntries = params
      .map((s, i) => {
        const symbol = s;
        const isValid = isSymbolString(s);
        return { symbol, isValid, index: i };
      })
      .filter(({ isValid }) => !isValid)
      .map(({ symbol, index }) => {
        const errMsg =
          symbol === ""
            ? "Parameter name cannot be empty."
            : `"${symbol}" is not a valid parameter name.`;
        return [index, errMsg] as const;
      });

    const dupes = pickBy(countBy(params), (c) => c > 1);
    const dupeEntries = params
      .map((symbol, index) => {
        return { symbol, index, isDupe: dupes[symbol] };
      })
      .filter(({ isDupe }) => isDupe)
      .map(({ index }) => [index, "Parameter names must be unique."] as const);

    const paramErrors = Object.fromEntries(
      [...dupeEntries, ...invalidEntries].map(([key, value]) => [
        key,
        new Error(value),
      ]),
    );

    if (Object.keys(paramErrors).length > 0) {
      const msg =
        invalidEntries.length === 0
          ? "Parameter names must be unique."
          : "Some parameter names are invalid.";
      throw new ParameterErrors(msg, paramErrors);
    }
    return text;
  },
};

export default validateParameters;
export { ParameterErrors };
