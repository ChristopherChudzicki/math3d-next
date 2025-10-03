import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";
import { makeItem, seedDb } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { findItemByTestId } from "@/features/sceneControls/mathItems/__tests__/__utils__";
import { use } from "react";
import { waitForElementToBeRemoved } from "@testing-library/react";

test.each([
  { isLegacy: true, case: "is" },
  { isLegacy: false, case: "is not" },
])(
  "Legacy Scene button $case rendered when isLegacy=$isLegacy",
  async ({ isLegacy }) => {
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item], { isLegacy });
    await renderTestApp(`/${scene.key}`);

    await findItemByTestId(item.id);
    const legacyButton = screen.queryByRole("button", { name: "Legacy Scene" });
    expect(!!legacyButton).toBe(isLegacy);
  },
);

test("Legacy Dialog opens and closes", async () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item], { isLegacy: true });
  renderTestApp(`/${scene.key}`);

  const legacyButton = await screen.findByRole("button", {
    name: "Legacy Scene",
  });
  await user.click(legacyButton);

  const dialog = await screen.findByRole("dialog", { name: "Legacy Scene" });
  expect(dialog).toBeVisible();

  const closeButton = await screen.findByRole("button", { name: "Close" });
  await user.click(closeButton);
  await waitForElementToBeRemoved(dialog);
});
