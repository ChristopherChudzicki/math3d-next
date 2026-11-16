import React from "react";
import { expect, test } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import expectToast from "@/test_util/expectToast";
import ToastHost from "./ToastHost";
import { showNotice, showToast } from "./toasts";

test("showing the same message again replaces the open toast", async () => {
  render(<ToastHost />);
  const region = screen.getByRole("region", { name: "Notifications" });
  await act(async () => showToast("Couldn’t save."));
  const first = within(region).getByText("Couldn’t save.");

  await act(async () => showToast("Couldn’t save."));

  // A new element, not the old one updated: that is what re-announces it.
  await waitFor(() => expect(first).not.toBeInTheDocument());
  expect(within(region).getAllByText("Couldn’t save.")).toHaveLength(1);
  await expectToast("Couldn’t save.");
});

test("a replaced notice's close function leaves its replacement open", async () => {
  render(<ToastHost />);
  const anchor = document.body;
  const closeFirst = await act(async () =>
    showNotice({ description: "Hidden by hand.", anchor }),
  );
  await act(async () => showNotice({ description: "Hidden by hand.", anchor }));

  await act(async () => closeFirst());

  await expectToast("Hidden by hand.");
});
