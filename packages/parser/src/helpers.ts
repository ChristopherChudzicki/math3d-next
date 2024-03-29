/**
 * This file includes helpers for parsing mathematical expressions, not
 * necessarily related to the MathScope adapter.
 */

const splitAtFirstEquality = (text: string): [string, string] => {
  const pieces = text.split("=");
  if (pieces.length < 2) {
    /**
     * The expression could have multiple equalities, e.g., for boolean
     * expressions like X = a >= 2
     */
    throw new Error(`Fatal error: Assignments should have an equality sign.`);
  }
  const [lhs, ...others] = pieces;
  const rhs = others.join("=");
  return [lhs, rhs];
};

interface FunctionAssignmentProps {
  name: string;
  params: string[];
  rhs: string;
}

/**
 * Represents a potentially invalid function assignment. For example:
 *  1. f(x, y)   = x
 *  2. f(x +, y) = x
 *  3. f(x, x)   = x
 *
 * This class only does enough parsing to determing the lhs, rhs, function name,
 * and parameter names. In this way, we can parse stirngs that MathJS's parser
 * would reject, and we can give slightly more detailed information about the
 * errors.
 *
 * @deprecated
 */
class FunctionAssignment {
  readonly params: string[];

  readonly name: string;

  readonly rhs: string;

  constructor({ name, params, rhs }: FunctionAssignmentProps) {
    this.params = params.map((p) => p.trim());
    this.name = name;
    this.rhs = rhs;
  }

  private static fromExprRegex = /(?<name>.+)\((?<paramsString>.*)\)\s*$/;

  static isFunctionLHS = (expr: string) =>
    FunctionAssignment.fromExprRegex.test(expr);

  static fromExpr(expr: string) {
    const [lhs, rhs] = splitAtFirstEquality(expr);
    const { paramsString, name } =
      lhs.trim().match(FunctionAssignment.fromExprRegex)?.groups ?? {};

    const params =
      paramsString.trim().length > 0 ? paramsString.split(",") : [];
    return new FunctionAssignment({ name, params, rhs });
  }

  clone(props: Partial<FunctionAssignmentProps> = {}) {
    const { name, params, rhs } = this;
    return new FunctionAssignment({ name, params, rhs, ...props });
  }

  toExpr(): string {
    return `${this.getLhs()}=${this.rhs.trim()}`;
  }

  getLhs(): string {
    return `${this.name}(${this.params.join(",")})`;
  }
}

export { FunctionAssignment };
