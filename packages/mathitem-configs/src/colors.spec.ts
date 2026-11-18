import { describe, expect, test } from "vitest";
import { getColorConfig } from "./colors";

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
