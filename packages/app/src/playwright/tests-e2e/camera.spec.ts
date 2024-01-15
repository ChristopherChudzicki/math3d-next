import { MathItemType as MIT, MathItem } from "@math3d/mathitem-configs";
import type { StrictScene as Scene } from "@math3d/api";
import { Page } from "@playwright/test";
import { test, expect } from "@/playwright/test";
import { faker } from "@faker-js/faker/locale/en";
import { Vector3 } from "three";
import { makeItem, seedDb } from "@math3d/mock-api";
import { whenMathboxRendered } from "./util";

type MakeSceneProps = {
  camera?: Partial<MathItem<MIT.Camera>["properties"]>;
  axisX?: Partial<MathItem<MIT.Axis>["properties"]>;
  axisY?: Partial<MathItem<MIT.Axis>["properties"]>;
  axisZ?: Partial<MathItem<MIT.Axis>["properties"]>;
};
const cameraScene = ({ camera, axisX, axisY, axisZ }: MakeSceneProps = {}) => {
  const scene: Scene = {
    key: faker.datatype.uuid(),
    title: "Camera Tests",
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
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.past().toISOString(),
  };

  return scene;
};

const getCameraPosition = async (
  page: Page,
): Promise<{ x: number; y: number; z: number }> => {
  await whenMathboxRendered(page);
  return page.evaluate(() => {
    // @ts-expect-error Mathbox is assigned to window but intentionally left off to discourage use.
    return window.mathbox.three.camera.position;
  });
};

const getControlsTarget = async (
  page: Page,
): Promise<{ x: number; y: number; z: number }> => {
  await whenMathboxRendered(page);
  return page.evaluate(() => {
    // @ts-expect-error Mathbox is assigned to window but intentionally left off to discourage use.
    return window.mathbox.three.controls.target;
  });
};

test("Setting camera position/target using UI coordinates", async ({
  page,
}) => {
  const scene = cameraScene({
    camera: { position: "[1, 3, 2]", target: "[-0.5, 2, 6]" },
    axisX: { min: "-2", max: "2" },
    axisY: { min: "-4", max: "4" },
    axisZ: { min: "-8", max: "8" },
  });
  seedDb.withScene(scene);
  await page.goto(`/${scene.key}`);
  const position = await getCameraPosition(page);
  expect(position.x).toBeCloseTo(0.5);
  expect(position.y).toBeCloseTo(0.75);
  expect(position.z).toBeCloseTo(0.25);

  const target = await getControlsTarget(page);
  expect(target.x).toBeCloseTo(-0.25);
  expect(target.y).toBeCloseTo(0.5);
  expect(target.z).toBeCloseTo(0.75);
});

test("`useRelative: true` sets camera position/target using ThreeJS coordinates", async ({
  page,
}) => {
  const scene = cameraScene({
    camera: {
      position: "[1, 3, 2]",
      target: "[-0.5, 2, 6]",
      useRelative: "true",
    },
    axisX: { min: "-2", max: "2" },
    axisY: { min: "-4", max: "4" },
    axisZ: { min: "-8", max: "8" },
  });
  seedDb.withScene(scene);
  await page.goto(`/${scene.key}`);
  const position = await getCameraPosition(page);
  expect(position.x).toBeCloseTo(1);
  expect(position.y).toBeCloseTo(3);
  expect(position.z).toBeCloseTo(2);

  const target = await getControlsTarget(page);
  expect(target.x).toBeCloseTo(-0.5);
  expect(target.y).toBeCloseTo(2);
  expect(target.z).toBeCloseTo(6);
});

test("isOrthographic: true does a dollyZoom", async ({ page }) => {
  const scene = cameraScene({
    camera: {
      position: "[1, 3, 2]",
      target: "[-0.5, 2, 6]",
      isOrthographic: "true",
    },
    axisX: { min: "-2", max: "2" },
    axisY: { min: "-4", max: "4" },
    axisZ: { min: "-8", max: "8" },
  });

  // position and target in scaled coordinates
  const expectedPos = new Vector3(1 / 2, 3 / 4, 2 / 8);
  const expectedTarget = new Vector3(-0.5 / 2, 2 / 4, 6 / 8);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

  seedDb.withScene(scene);
  await page.goto(`/${scene.key}`);
  const cameraPos = await getCameraPosition(page);
  expect(cameraPos.x).toBeCloseTo(expectedCameraPos.x);
  expect(cameraPos.y).toBeCloseTo(expectedCameraPos.y);
  expect(cameraPos.z).toBeCloseTo(expectedCameraPos.z);

  const cameraTarget = await getControlsTarget(page);
  expect(cameraTarget.x).toBeCloseTo(expectedTarget.x);
  expect(cameraTarget.y).toBeCloseTo(expectedTarget.y);
  expect(cameraTarget.z).toBeCloseTo(expectedTarget.z);
});

test("isOrthographic: true does a dollyZoom with useRelative: true", async ({
  page,
}) => {
  const scene = cameraScene({
    camera: {
      position: "[1, 3, 2]",
      target: "[-0.5, 2, 6]",
      isOrthographic: "true",
      useRelative: "true",
    },
    axisX: { min: "-2", max: "2" },
    axisY: { min: "-4", max: "4" },
    axisZ: { min: "-8", max: "8" },
  });

  // position and target in scaled coordinates
  const expectedPos = new Vector3(1, 3, 2);
  const expectedTarget = new Vector3(-0.5, 2, 6);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

  seedDb.withScene(scene);
  await page.goto(`/${scene.key}`);
  const cameraPos = await getCameraPosition(page);
  expect(cameraPos.x).toBeCloseTo(expectedCameraPos.x);
  expect(cameraPos.y).toBeCloseTo(expectedCameraPos.y);
  expect(cameraPos.z).toBeCloseTo(expectedCameraPos.z);

  const cameraTarget = await getControlsTarget(page);
  expect(cameraTarget.x).toBeCloseTo(expectedTarget.x);
  expect(cameraTarget.y).toBeCloseTo(expectedTarget.y);
  expect(cameraTarget.z).toBeCloseTo(expectedTarget.z);
});
