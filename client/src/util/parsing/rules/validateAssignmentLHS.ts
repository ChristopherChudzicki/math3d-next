import * as math from "mathjs";

import { AssignmentError } from "../../MathScope";
import { ParserRuleType, TextParserRule } from "../interfaces";
import { FunctionAssignment } from "../helpers";

class ParseAssignmentLHSError extends AssignmentError {
  details: {
    isFunctionAssignment: boolean;
    paramErrors: Record<number, string>;
  };

  constructor(
    msg: string,
    isFunctionAssignment: boolean,
    paramErrors: Record<number, string> = {}
  ) {
    super(msg);
    this.details = {
      isFunctionAssignment,
      paramErrors,
    };
  }
}

const handleFuncLhs = (lhs: string) => {
  const funcAssignment = FunctionAssignment.fromExpr(`${lhs}=1`);
  console.log(funcAssignment);
  throw new Error("Foo");
};

const validateAssignmentLHS: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text: string): string => {
    const [lhs, rhs] = text.split("=");
    if (lhs && rhs) {
      if (FunctionAssignment.isFunctionAssignment(lhs)) {
        handleFuncLhs(lhs);
      } else {
        const assignment = `${lhs}=1`;
        try {
          math.parse(assignment);
        } catch (error) {
          throw new ParseAssignmentLHSError(
            `Invalid assignment left-hand side.`,
            false
          );
        }
      }
    }
    return text;
  },
};

export { ParseAssignmentLHSError };

export default validateAssignmentLHS;
