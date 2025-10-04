import { SceneBuilder } from "@math3d/mock-api";
import { test } from "vitest";
import { getStore } from "@/store/store";
import { actions } from "./scene.slice";
import { defaultGraphicOrder } from "./selectors";

test("defaultGraphicOrder returns expected values", () => {
  const scene = new SceneBuilder();
  scene
    .folder({ description: "F1" })
    .point({ description: "F1_point" })
    .line({ description: "F1_line" })
    .explicitSurface({ description: "F1_surfaceA" })
    .implicitSurface({ description: "F1_surfaceB", zOrder: "4" });
  scene
    .folder({ description: "F2" })
    .point({ description: "F2_point" })
    .line({ description: "F2_line" })
    .parametricSurface({ description: "F2_surfaceA", zOrder: "100" })
    .explicitSurfacePolar({ description: "F2_surfaceB" });

  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  const state = store.getState();
  const result = defaultGraphicOrder(state);
  const readableResult = Object.fromEntries(
    Object.entries(result).map(([key, value]) => [
      key,
      [state.scene.items[key].properties.description, value],
    ]),
  );
  expect(readableResult).toEqual({
    // Setup first
    "grid-zx": ["Grid", 0],
    "grid-yz": ["Grid", 1],
    "grid-xy": ["Grid", 2],
    "axis-z": ["Axis", 3],
    "axis-y": ["Axis", 4],
    "axis-x": ["Axis", 5],
    // First folder, top to bottom, but surfaces come last
    "1": ["F1_point", 9],
    "2": ["F1_line", 8],
    "3": ["F1_surfaceA", 13],
    "4": ["F1_surfaceB", 12],
    // Second folder, top to bottom, but surfaces come last
    "6": ["F2_point", 7],
    "7": ["F2_line", 6],
    "8": ["F2_surfaceA", 11],
    "9": ["F2_surfaceB", 10],
  });
});
