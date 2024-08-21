import MathScope from "@math3d/mathscope";
import { latexParser, Parseable } from "@math3d/parser";
import math from "@math3d/custom-mathjs";
import { AppMathScope } from "./interfaces";

const builtins = new Set(
  Object.keys(
    // @ts-expect-error Unclear to me whehter this is a public
    math.expression.mathWithTransform,
  ),
);
const makeMathScope = (): AppMathScope =>
  new MathScope<Parseable>({ parse: latexParser.parse, builtins });

export { makeMathScope, builtins };
