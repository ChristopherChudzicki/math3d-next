import * as math from "mathjs";
import { countBy, pickBy } from "lodash";
import { AssignmentError } from "../../MathScope";
import { ParserRuleType, TextParserRule } from "../interfaces";
import { FunctionAssignment } from "../helpers";

class ParseAssignmentLHSError extends AssignmentError {
  details: {
    isFunctionAssignment: boolean;
    paramErrors: Record<number, Error>;
  };

  constructor(
    msg: string,
    isFunctionAssignment: boolean,
    paramErrors: Record<number, Error> = {}
  ) {
    super(msg);
    this.details = {
      isFunctionAssignment,
      paramErrors,
    };
  }
}

const isSymbolString = (s: string) => {
  try {
    return math.parse(s).type === "SymbolNode";
  } catch (err) {
    return false;
  }
};

const handleFuncLhs = (lhs: string) => {
  const funcAssignment = FunctionAssignment.fromExpr(`${lhs}=1`);
  const invalidEntries = funcAssignment.params
    .map((s, i) => {
      const symbol = s;
      const isValid = isSymbolString(s);
      return { symbol, isValid, index: i };
    })
    .filter(({ isValid }) => !isValid)
    .map(
      ({ symbol, index }) =>
        [index, `"${symbol}" is not a valid parameter name.`] as const
    );

  const dupes = pickBy(countBy(funcAssignment.params), (c) => c > 1);
  const dupeEntries = funcAssignment.params
    .map((symbol, index) => {
      return { symbol, index, isDupe: dupes[symbol] };
    })
    .filter(({ isDupe }) => isDupe)
    .map(({ index }) => [index, "Parameter names must be unique."] as const);

  const paramErrors = Object.fromEntries(
    [...dupeEntries, ...invalidEntries].map(([key, value]) => [
      key,
      new Error(value),
    ])
  );

  if (Object.keys(paramErrors).length > 0) {
    throw new ParseAssignmentLHSError("Invalid assignment.", true, paramErrors);
  }
};
/**
 * Validate the left-hand-side of an assignment expression.
 *
 * Why? MathJS's `math.parse` gives essentially the same error when parsing
 *  - "f(x, y) = x +"
 *  - "f(x +, y" = x"
 *
 * But we'd like to diagnose
 *  - is the error on the LHS or RHS of the assignment?
 *  - if the error is on the LHS, and this is a function assignment, was this an
 *    error with a parameter name, and if so, which one?
 */
const validateAssignmentLHS: TextParserRule = {
  type: ParserRuleType.Text,
  transform: (text: string): string => {
    const [lhs, rhs] = text.split("=");
    if (lhs && rhs) {
      const assignment = `${lhs}=1`;
      if (FunctionAssignment.isFunctionLHS(lhs)) {
        handleFuncLhs(lhs);
      }
      try {
        math.parse(assignment);
      } catch (error) {
        throw new ParseAssignmentLHSError(
          `Invalid assignment left-hand side.`,
          false
        );
      }
    }
    return text;
  },
};

export { ParseAssignmentLHSError };

export default validateAssignmentLHS;
