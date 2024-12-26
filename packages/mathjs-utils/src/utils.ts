const isComplex = (value: unknown): value is { im: number; re: number } => {
  if (value === null || value === undefined) return false;
  // @ts-expect-error Checking properties that might not exist
  return typeof value.im === "number" && typeof value.re === "number";
};

export { isComplex };
