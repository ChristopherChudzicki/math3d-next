/**
 * This file includes helpers for parsing mathematical expressions, not
 * necessarily related to the MathScope adapter.
 */

const splitAtFirstEquality = (text: string): [string, string] => {
  const pieces = text.split("=");
  if (pieces.length < 2) {
    // They should have eactly one, but if they have more, that's an issue for the parser
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
class FunctionAssignment {
  readonly params: string[];

  readonly name: string;

  readonly rhs: string;

  constructor({ name, params, rhs }: FunctionAssignmentProps) {
    this.params = params;
    this.name = name;
    this.rhs = rhs;
  }

  private static fromExprRegex = /(?<name>.+)\((?<paramsString>.*)\)$/;

  static fromExpr(expr: string) {
    const [lhs, rhs] = splitAtFirstEquality(expr);
    const { paramsString, name } =
      lhs.trim().match(FunctionAssignment.fromExprRegex)?.groups ?? {};
    const params = paramsString.split(",");
    return new FunctionAssignment({ name, params, rhs });
  }

  clone(props: Partial<FunctionAssignmentProps> = {}) {
    const { name, params, rhs } = this;
    return new FunctionAssignment({ name, params, rhs, ...props });
  }

  toExpr(): string {
    return `${this.getLhs()}=${this.rhs}`;
  }

  getLhs(): string {
    return `${this.name}(${this.params.join(",")})`;
  }
}

export { FunctionAssignment, splitAtFirstEquality };
