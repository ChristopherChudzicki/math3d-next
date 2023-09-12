const isComplex = (value: object): value is { im: number; re: number } => {
  // @ts-expect-error Checking properties that might not exist
  return typeof value.im === "number" && typeof value.re === "number";
};

const isNotNull = <T>(x: T | null): x is T => {
  return x !== null;
};

const scalarToLaTeX = (value: unknown): string | null => {
  const valType = typeof value;
  if (valType === "number") {
    return `${value}`;
  }
  if (valType === "function") return null;
  if (valType === "boolean") return `${value}`;
  if (value === null || value === undefined) return null;
  if (isComplex(value)) {
    return `${scalarToLaTeX(value.re)} + ${scalarToLaTeX(value.im)}i`;
  }
  return null;
};

const maybeVector = (value: unknown): value is unknown[] => {
  return Array.isArray(value) && !Array.isArray(value[0]);
};

const maybeMatrix = (value: unknown): value is unknown[][] => {
  return Array.isArray(value) && maybeVector(value[0]);
};

const toLaTeX = (value: unknown): string | null => {
  if (maybeVector(value)) {
    const vals = value.map((x) => scalarToLaTeX(x));
    if (vals.every(isNotNull)) {
      return `[${vals.join(", ")}]`;
    }
  }
  if (maybeMatrix(value)) {
    const vals = value.map((row) => {
      return row.map((x) => scalarToLaTeX(x));
    });
    if (vals.every((row) => row.every(isNotNull))) {
      return `\\begin{bmatrix}
${vals.map((row) => row.join(" & ")).join(" \\\\\n")}
\\end{bmatrix}`;
    }
    if (vals.every(isNotNull)) {
      return `[${vals.join(", ")}]`;
    }
  }
  return scalarToLaTeX(value);
};

export default toLaTeX;
