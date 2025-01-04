import React from "react";

interface BaseReferenceEntry {
  id: string;
  /**
   * Human-readable name, displayed to users
   */
  name: string;
  latex: string;
  keyboard: string;
  shortDescription: string;
  longDescription?: string;
  tags: string[];
}
interface ConstantEntry extends BaseReferenceEntry {
  type: "constant";
  value: string;
}
interface FunctionEntry extends BaseReferenceEntry {
  type: "function";
}

type ReferenceEntry = ConstantEntry | FunctionEntry;

enum Tags {
  Trig = "Trigonometry",
  Alg = "Algebra",
  Calc = "Calculus",
  Exp = "Exponents & Logarithms",
  Misc = "Miscellaneous",
}

const makeReferences = (
  entries: (Omit<ReferenceEntry, "id"> & { id?: string })[],
): ReferenceEntry[] =>
  entries.map((e) => {
    return {
      ...e,
      id: e.id ?? e.name,
    } as ReferenceEntry;
  });

const FUNCTIONS: ReferenceEntry[] = makeReferences([
  {
    type: "function",
    name: "sine",
    latex: "\\(\\sin(x)\\)",
    keyboard: "sin(x)",
    shortDescription: "Sine",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "cosine",
    latex: "\\(\\cos(x)\\)",
    keyboard: "cos(x)",
    shortDescription: "Cosine",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "tangent",
    latex: "\\(\\tan(x)\\)",
    keyboard: "tan(x)",
    shortDescription: "Tangent",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "secant",
    latex: "\\(\\sec(x)\\)",
    keyboard: "sec(x)",
    shortDescription: "Secant",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "cosecant",
    latex: "\\(\\csc(x)\\)",
    keyboard: "csc(x)",
    shortDescription: "Cosecant",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "cotangent",
    latex: "\\(\\cot(x)\\)",
    keyboard: "cot(x)",
    shortDescription: "Cotangent",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arcsine",
    latex: "\\(\\arcsin(x)\\)",
    keyboard: "arcsin(x)",
    shortDescription: "Inverse sine",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arccosine",
    latex: "\\(\\arccos(x)\\)",
    keyboard: "arccos(x)",
    shortDescription: "Inverse cosine",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arctangent",
    latex: "\\(\\arctan(x)\\)",
    keyboard: "arctan(x)",
    shortDescription: "Inverse tangent; see also `arctan(y, x)`.",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arctangent",
    id: "atan2",
    latex: "\\(\\arctan(y, x)\\)",
    keyboard: "arctan(y, x)",
    shortDescription: `
2-argument arctangent:
- \\(\\arctan(y, x)\\) is the angle between the positive x-axis and the ray between origin and \\((x, y)\\).
- Its range is \\([-\\pi, \\pi]\\).
- For points in quadrants 1 and 4, \\(\\arctan(y,x)=\\arctan(y/x)\\).
`,
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arcsecant",
    latex: "\\(\\arcsec(x)\\)",
    keyboard: "arcsec(x)",
    shortDescription: "Inverse secant",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arccosecant",
    latex: "\\(\\arccsc(x)\\)",
    keyboard: "arccsc(x)",
    shortDescription: "Inverse cosecant",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "arccotangent",
    latex: "\\(\\operatorname{arccot}(x)\\)",
    keyboard: "arccot(x)",
    shortDescription: "Inverse cotangent",
    tags: [Tags.Trig],
  },
  {
    type: "function",
    name: "absolute value",
    latex: "\\(\\operatorname{abs}(x)\\)",
    keyboard: "abs(x)",
    shortDescription: "Absolute value",
    tags: [Tags.Misc],
  },
  {
    type: "function",
    name: "floor",
    latex: "\\(\\operatorname{floor}(x)\\)",
    keyboard: "floor(x)",
    shortDescription: "Floor",
    tags: [Tags.Misc],
  },
  {
    type: "function",
    name: "ceiling",
    latex: "\\(\\operatorname{ceil}(x)\\)",
    keyboard: "ceil(x)",
    shortDescription: "Ceiling",
    tags: [Tags.Misc],
  },
  {
    type: "function",
    name: "sign",
    latex: "\\(\\operatorname{sign}(x)\\)",
    keyboard: "sign(x)",
    shortDescription: "Sign",
    tags: [Tags.Misc],
  },
  {
    type: "function",
    name: "logarithm",
    latex: "\\(\\log(x)\\)",
    keyboard: "log(x)",
    shortDescription: "Natural logarithm (alias: \\(\\ln(x)\\))",
    tags: [Tags.Exp],
  },
  {
    type: "function",
    name: "logarithm",
    id: "logb",
    latex: "\\(\\log(x, b)\\)",
    keyboard: "log(x, b)",
    shortDescription: "Logarithm with base \\(b\\)",
    tags: [Tags.Exp],
  },
  {
    type: "function",
    name: "natural logarithm",
    latex: "\\(\\ln(x)\\)",
    keyboard: "ln(x)",
    shortDescription: "Natural logarithm (alias: \\(log(x)\\))",
    tags: [Tags.Exp],
  },
  {
    type: "function",
    name: "exponential",
    latex: "\\(e^x\\)",
    keyboard: "e^x",
    shortDescription: "Exponential",
    tags: [Tags.Exp],
  },
  {
    type: "function",
    name: "square root",
    latex: "\\(\\sqrt{x}\\)",
    keyboard: "sqrt(x)",
    shortDescription: "Square root",
    tags: [Tags.Alg],
  },
  {
    type: "function",
    name: "cube root",
    latex: "\\(\\operatorname{cbrt}{x}\\)",
    keyboard: "cbrt(x)",
    shortDescription: "Cube root",
    tags: [Tags.Alg],
  },
]);

export { FUNCTIONS, Tags };
export type { ReferenceEntry };
