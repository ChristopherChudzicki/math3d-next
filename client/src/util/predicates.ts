import { MathItemType as MIT } from "types";

export const isMathItemType = <T extends MIT = MIT>(
  value: unknown
): value is T => {
  if (typeof value !== "string") return false;
  return (Object.values(MIT) as string[]).includes(value);
};

export const assertIsMathItemType: <T extends MIT = MIT>(
  value: unknown
) => asserts value is T = (value) => {
  if (!isMathItemType(value)) {
    throw new Error(`expected "${value}" to be a MathItemType`);
  }
};
