import * as math from "mathjs";
import { countBy } from "lodash";
import { AssignmentError } from "@/util/MathScope";
import { ParserRuleType, TextParserRule } from "../interfaces";

const FUNCTION_ASSIGNMENT_REGEX = /\((?<params>.*?)\)[^><=]?\s*=\s*[^><=]?/;

/**
 * Validate parameters in a function assignment are valid names
 */
const validateAssignmentLHS: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text: string): string => {
    const match = text.match(FUNCTION_ASSIGNMENT_REGEX);
    if (!match?.groups?.params) return text;
    if (match.groups.params.trim() === "") return text;
    const params = match.groups.params.split(",");
    params.forEach((p) => {
      try {
        return math.parse(p).type === "SymbolNode";
      } catch (err) {
        throw new AssignmentError(`"${p}" is not a valid parameter name.`);
      }
    });

    const paramCounts = countBy(params);
    const dupe = Object.entries(paramCounts).find(([_k, v]) => v > 1);
    if (dupe) {
      throw new AssignmentError(
        `Parameter names must be unique. Name ${dupe[0]} used multiple times.`
      );
    }

    return text;
  },
};

export default validateAssignmentLHS;
