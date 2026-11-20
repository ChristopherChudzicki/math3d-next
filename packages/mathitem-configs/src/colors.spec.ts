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

test.each([
  { name: "rainbow", x: 0, rgb: [1, 0, 0] },
  { name: "rainbow", x: 0.25, rgb: [0.5, 0, 1] },
  { name: "temperature", x: 0, rgb: [0, 0, 1] },
  { name: "temperature", x: 0.5, rgb: [0, 1, 0] },
] as const)("$name at $x is $rgb", ({ name, x, rgb }) => {
  gradients[name].getRGB(x).forEach((channel, i) => {
    expect(channel).toBeCloseTo(rgb[i], 2);
  });
});

describe.each(Object.values(gradients))("$label gradient", ({ getRGB }) => {
  test("a value outside [0, 1] takes the nearer end's color", () => {
    expect(getRGB(-0.5)).toEqual(getRGB(0));
    expect(getRGB(1.5)).toEqual(getRGB(1));
  });

  test("NaN is black", () => {
    expect(getRGB(NaN)).toEqual([0, 0, 0]);
  });
});
