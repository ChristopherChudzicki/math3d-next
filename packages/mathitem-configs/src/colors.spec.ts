import { describe, expect, test } from "vitest";
import { getColorConfig, gradients } from "./colors";

describe("getColorConfig", () => {
  test("names a predefined color in any letter case", () => {
    expect(getColorConfig("#3090FF")).toMatchObject({
      type: "color",
      label: "Blue",
    });
  });

  test("matches a gradient by its exact name only", () => {
    expect(getColorConfig("rainbow").type).toBe("gradient");
    expect(getColorConfig("Rainbow").type).toBe("color");
  });
});

describe.each(Object.values(gradients))("$label gradient", ({ getRGB }) => {
  test("a value outside [0, 1] takes the nearer end's color", () => {
    expect(getRGB(-0.5)).toEqual(getRGB(0));
    expect(getRGB(1.5)).toEqual(getRGB(1));
  });
});
