import { MathItemType as MIT, MathItem } from "@math3d/mathitem-configs";
import { makeItem, renderTestApp, seedDb } from "@/test_util";
import { Scene } from "@/types";
import * as MB from "mathbox-react";

type MakeSceneProps = {
  camera?: Partial<MathItem<MIT.Camera>["properties"]>;
  axisX?: Partial<MathItem<MIT.Axis>["properties"]>;
  axisY?: Partial<MathItem<MIT.Axis>["properties"]>;
  axisZ?: Partial<MathItem<MIT.Axis>["properties"]>;
};
const cameraScene = ({ camera, axisX, axisY, axisZ }: MakeSceneProps = {}) => {
  const scene: Omit<Scene, "key"> = {
    title: "Untitled",
    items: [
      makeItem(MIT.Camera, camera, "camera"),
      makeItem(MIT.Axis, { axis: "x", ...axisX }, "axis-x"),
      makeItem(MIT.Axis, { axis: "y", ...axisY }, "axis-y"),
      makeItem(MIT.Axis, { axis: "z", ...axisZ }, "axis-z"),
      makeItem(MIT.Folder, { description: "Camera Controls" }, "cameraFolder"),
      makeItem(MIT.Folder, { description: "Axes and Grids" }, "axes"),
      makeItem(MIT.Folder, { description: "A Folder" }, "initialFolder"),
    ],
    itemOrder: {
      axes: ["axis-x", "axis-y", "axis-z"],
      main: ["initialFolder"],
      setup: ["cameraFolder", "axes"],
      cameraFolder: ["camera"],
      initialFolder: [],
    },
  };

  return scene;
};

const spyCamera = vi.spyOn(
  MB.Camera,
  // @ts-expect-error This is a ForwardRefExoticComponent
  "render"
);

test("Position is passed to Camera, scaled to Coordinates", async () => {
  const scene = seedDb.withScene(
    cameraScene({
      camera: { position: "[2, 3, 4]" },
      axisX: { min: "-2", max: "2" },
      axisY: { min: "-4", max: "4" },
      axisZ: { min: "-8", max: "8" },
    })
  );
  await renderTestApp(`/${scene.key}`);
  // TODO: move this to playwright
});
