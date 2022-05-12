import { MathItemType as MIT } from "types";

export const isMathItemType = <T extends MIT = MIT>(
  value: unknown
): value is T => {
  if (typeof value !== "string") return false;
  return (Object.values(MIT) as string[]).includes(value);
};

export const assertIsMathItemType: <T extends MIT = MIT>(
  value: unknown,
  type?: T
) => asserts value is T = (value, type) => {
  if (type && value !== type) {
    throw new Error(`Expected ${value} to be ${type}`);
  } else if (!isMathItemType(value)) {
    throw new Error(`expected "${value}" to be a MathItemType`);
  }
};

export const isNotNil = <T>(x: T): x is NonNullable<T> => {
  if (x === null || x === undefined) return false;
  return true;
};

export const assertNotNil: <T>(value: T) => asserts value is NonNullable<T> = (
  value
) => {
  if (isNotNil(value)) return;
  throw new Error(`Value ${value} should not be nil.`);
};
