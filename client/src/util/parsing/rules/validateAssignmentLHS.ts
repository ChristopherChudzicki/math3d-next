import * as math from "mathjs";
import { AssignmentError } from "../../MathScope";
import { ParserRuleType, TextParserRule } from "../interfaces";

class ParseAssignmentLHSError extends AssignmentError {}

const validateAssignmentLHS: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text: string): string => {
    const [lhs, rhs] = text.split("=");
    if (lhs && rhs) {
      const assignment = `${lhs}=1`;
      try {
        math.parse(assignment);
      } catch (error) {
        throw new ParseAssignmentLHSError(`Invalid assignment left-hand side.`);
      }
    }
    return text;
  },
};

export { ParseAssignmentLHSError };

export default validateAssignmentLHS;
