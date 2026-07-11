import React from "react";
import { test, expect, vi } from "vitest";
import { act, renderTestApp, screen, user } from "@/test_util";
import { render, waitFor } from "@testing-library/react";
import { makeItem, seedDb } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { findItemByTestId } from "@/features/sceneControls/mathItems/__tests__/__utils__";
import LegacyBanner from "./LegacyBanner";

const DISMISSED_KEY = "legacyBannerDismissed";

test.each([
  { isLegacy: true, case: "is" },
  { isLegacy: false, case: "is not" },
])(
  "Legacy Scene banner $case shown when isLegacy=$isLegacy",
  async ({ isLegacy }) => {
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item], { isLegacy });
    renderTestApp(`/${scene.key}`);

    await findItemByTestId(item.id);
    const banner = screen.queryByText(
      /This scene was created with an older version of Math3d\./,
    );
    expect(!!banner).toBe(isLegacy);
  },
);

test("banner is not shown once permanently dismissed", async () => {
  localStorage.setItem(DISMISSED_KEY, "true");
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item], { isLegacy: true });
  renderTestApp(`/${scene.key}`);

  await findItemByTestId(item.id);
  expect(
    screen.queryByText(/This scene was created with an older version/),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Legacy Scene" }),
  ).toBeInTheDocument();
});

test("View details in the banner opens the legacy dialog", async () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item], { isLegacy: true });
  renderTestApp(`/${scene.key}`);

  await findItemByTestId(item.id);
  const viewDetails = await screen.findByRole("button", {
    name: "View details",
  });
  await user.click(viewDetails);

  expect(
    await screen.findByRole("dialog", { name: "Legacy Scene" }),
  ).toBeVisible();
});

test("dismissing the banner on one legacy scene does not suppress it on a different legacy scene navigated to client-side", async () => {
  const itemA = makeItem(MIT.Point);
  const sceneA = seedDb.withSceneFromItems([itemA], { isLegacy: true });
  const itemB = makeItem(MIT.Point);
  const sceneB = seedDb.withSceneFromItems([itemB], { isLegacy: true });

  const { router } = renderTestApp(`/${sceneA.key}`);
  await findItemByTestId(itemA.id);

  const dismiss = await screen.findByRole("button", {
    name: "Dismiss legacy scene notice",
  });
  await user.click(dismiss);
  await waitFor(() =>
    expect(
      screen.queryByText(/This scene was created with an older version/),
    ).not.toBeInTheDocument(),
  );

  await act(async () => {
    await router.navigate(`/${sceneB.key}`);
  });
  await findItemByTestId(itemB.id);

  expect(
    await screen.findByText(/This scene was created with an older version/),
  ).toBeVisible();
});

// The remaining tests exercise LegacyBanner's own dismiss/remember lifecycle
// in isolation (rather than via renderTestApp), so that advancing fake timers
// doesn't also tick unrelated timers elsewhere in the full app.

test("dismissing without the checkbox closes the banner without persisting", async () => {
  render(<LegacyBanner onViewDetails={vi.fn()} />);

  const dismiss = await screen.findByRole("button", {
    name: "Dismiss legacy scene notice",
  });
  await user.click(dismiss);

  expect(
    screen.queryByText(/This scene was created with an older version/),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem(DISMISSED_KEY)).not.toBe("true");
});

test("dismissing with the checkbox shows a confirmation then persists and auto-closes", async () => {
  render(<LegacyBanner onViewDetails={vi.fn()} confirmationDurationMs={20} />);

  const checkbox = await screen.findByRole("checkbox", {
    name: "Don't show this automatically again",
  });
  await user.click(checkbox);
  const dismiss = await screen.findByRole("button", {
    name: "Dismiss legacy scene notice",
  });
  await user.click(dismiss);

  expect(localStorage.getItem(DISMISSED_KEY)).toBe("true");
  expect(
    await screen.findByText(/Got it — the old-site link is still/),
  ).toBeVisible();

  await waitFor(() =>
    expect(
      screen.queryByText(/Got it — the old-site link is still/),
    ).not.toBeInTheDocument(),
  );
});

test("clicking dismiss again during the confirmation closes immediately", async () => {
  render(<LegacyBanner onViewDetails={vi.fn()} />);

  const checkbox = await screen.findByRole("checkbox", {
    name: "Don't show this automatically again",
  });
  await user.click(checkbox);
  const dismiss = await screen.findByRole("button", {
    name: "Dismiss legacy scene notice",
  });
  await user.click(dismiss);
  await screen.findByText(/Got it — the old-site link is still/);

  await user.click(dismiss);
  expect(
    screen.queryByText(/Got it — the old-site link is still/),
  ).not.toBeInTheDocument();
});
