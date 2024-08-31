import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Vector3 } from "three";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { whenMathboxRendered } from "@/utils/selectors";

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

const user = makeUserInfo();
test.use({ user });

test("Setting camera position/target using UI coordinates", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2" });
  scene.axis("y", { min: "-4", max: "4" });
  scene.axis("z", { min: "-8", max: "8" });
  scene.camera({ position: "[1, 3, 2]", target: "[-0.5, 2, 6]" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
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
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2" });
  scene.axis("y", { min: "-4", max: "4" });
  scene.axis("z", { min: "-8", max: "8" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    useRelative: "true",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);

  const position = await getCameraPosition(page);
  expect(position.x).toBeCloseTo(1);
  expect(position.y).toBeCloseTo(3);
  expect(position.z).toBeCloseTo(2);

  const target = await getControlsTarget(page);
  expect(target.x).toBeCloseTo(-0.5);
  expect(target.y).toBeCloseTo(2);
  expect(target.z).toBeCloseTo(6);
});

test("isOrthographic: true does a dollyZoom", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2" });
  scene.axis("y", { min: "-4", max: "4" });
  scene.axis("z", { min: "-8", max: "8" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    isOrthographic: "true",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);

  // position and target in scaled coordinates
  const expectedPos = new Vector3(1 / 2, 3 / 4, 2 / 8);
  const expectedTarget = new Vector3(-0.5 / 2, 2 / 4, 6 / 8);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

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
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2" });
  scene.axis("y", { min: "-4", max: "4" });
  scene.axis("z", { min: "-8", max: "8" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    isOrthographic: "true",
    useRelative: "true",
  });
  const key = await prepareScene(scene.json());

  // position and target in scaled coordinates
  const expectedPos = new Vector3(1, 3, 2);
  const expectedTarget = new Vector3(-0.5, 2, 6);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

  await page.goto(`/${key}`);
  const cameraPos = await getCameraPosition(page);
  expect(cameraPos.x).toBeCloseTo(expectedCameraPos.x);
  expect(cameraPos.y).toBeCloseTo(expectedCameraPos.y);
  expect(cameraPos.z).toBeCloseTo(expectedCameraPos.z);

  const cameraTarget = await getControlsTarget(page);
  expect(cameraTarget.x).toBeCloseTo(expectedTarget.x);
  expect(cameraTarget.y).toBeCloseTo(expectedTarget.y);
  expect(cameraTarget.z).toBeCloseTo(expectedTarget.z);
});
