import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Vector3 } from "three";
import { SceneBuilder } from "@math3d/mock-api";
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
const expectCameraPos = async (page: Page, vec: Vector3) => {
  return expect(async () => {
    const position = await getCameraPosition(page);
    expect(position.x).toBeCloseTo(vec.x);
    expect(position.y).toBeCloseTo(vec.y);
    expect(position.z).toBeCloseTo(vec.z);
  }).toPass();
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
const expectControlsTarget = async (page: Page, vec: Vector3) => {
  return expect(async () => {
    const target = await getControlsTarget(page);
    expect(target.x).toBeCloseTo(vec.x);
    expect(target.y).toBeCloseTo(vec.y);
    expect(target.z).toBeCloseTo(vec.z);
  }).toPass();
};

test("Setting camera position/target using UI coordinates", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2", scale: "1/2" });
  scene.axis("y", { min: "-4", max: "4", scale: "2" });
  scene.axis("z", { min: "-8", max: "8", scale: "3/2" });
  scene.camera({ position: "[1, 3, 2]", target: "[-0.5, 2, 6]" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
  const scales = new Vector3(1 / 2, 2, 3 / 2);
  await expectCameraPos(page, new Vector3(0.5, 0.75, 0.25).multiply(scales));
  await expectControlsTarget(
    page,
    new Vector3(-0.25, 0.5, 0.75).multiply(scales),
  );
});

test("`useRelative: true` sets camera position/target using ThreeJS coordinates", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2", scale: "1/2" });
  scene.axis("y", { min: "-4", max: "4", scale: "2" });
  scene.axis("z", { min: "-8", max: "8", scale: "3/2" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    useRelative: "true",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);

  const scales = new Vector3(1 / 2, 2, 3 / 2);
  await expectCameraPos(page, new Vector3(1, 3, 2).multiply(scales));
  await expectControlsTarget(page, new Vector3(-0.5, 2, 6).multiply(scales));
});

test("isOrthographic: true does a dollyZoom", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2", scale: "1/2" });
  scene.axis("y", { min: "-4", max: "4", scale: "2" });
  scene.axis("z", { min: "-8", max: "8", scale: "3/2" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    isOrthographic: "true",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);

  // position and target in scaled coordinates
  const scales = new Vector3(1 / 2, 2, 3 / 2);
  const expectedPos = new Vector3(1 / 2, 3 / 4, 2 / 8).multiply(scales);
  const expectedTarget = new Vector3(-0.5 / 2, 2 / 4, 6 / 8).multiply(scales);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

  await expectCameraPos(page, expectedCameraPos);
  await expectControlsTarget(page, expectedTarget);
});

test("isOrthographic: true does a dollyZoom with useRelative: true", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.axis("x", { min: "-2", max: "2", scale: "1/2" });
  scene.axis("y", { min: "-4", max: "4", scale: "2" });
  scene.axis("z", { min: "-8", max: "8", scale: "3/2" });
  scene.camera({
    position: "[1, 3, 2]",
    target: "[-0.5, 2, 6]",
    isOrthographic: "true",
    useRelative: "true",
  });
  const key = await prepareScene(scene.json());

  // position and target in scaled coordinates
  const scales = new Vector3(1 / 2, 2, 3 / 2);
  const expectedPos = new Vector3(1, 3, 2).multiply(scales);
  const expectedTarget = new Vector3(-0.5, 2, 6).multiply(scales);
  const diff = expectedPos.clone().sub(expectedTarget);
  const zoomFactor = 40 - 1;
  const expectedCameraPos = expectedPos.add(diff.multiplyScalar(zoomFactor));

  await page.goto(`/${key}`);

  await expectCameraPos(page, expectedCameraPos);
  await expectControlsTarget(page, expectedTarget);
});
