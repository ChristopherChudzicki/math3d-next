import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { makeItem } from "@math3d/mock-api";
import { finalVisibility } from "./mathScope";

describe("finalVisibility", () => {
  it("shows an item whose calculated visibility errors, even over a stale result", () => {
    const item = makeItem(MIT.Point, {
      visible: false,
      useCalculatedVisibility: true,
      calculatedVisibility: "t>0",
    });
    expect(finalVisibility(item, false, new Error())).toBe(true);
  });
});
