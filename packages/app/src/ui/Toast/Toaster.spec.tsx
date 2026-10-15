import React from "react";
import { expect, onTestFinished, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster, createToastManager } from ".";

// F6 focuses the viewport and Tab a toast; Escape from either must not reach
// the `document` listener that closes the dialog or drawer beneath.
test.each([
  {
    from: "the viewport",
    target: () => screen.getByRole("region", { name: "Notifications" }),
  },
  { from: "a toast", target: () => screen.getByText("Couldn’t save.") },
])("Escape on $from doesn't reach the document", ({ target }) => {
  const toastManager = createToastManager();
  render(<Toaster toastManager={toastManager} />);
  act(() => {
    toastManager.add({ description: "Couldn’t save.", timeout: 0 });
  });
  const onKeyDown = vi.fn();
  document.addEventListener("keydown", onKeyDown);
  onTestFinished(() => document.removeEventListener("keydown", onKeyDown));

  fireEvent.keyDown(target(), { key: "Escape" });
  expect(onKeyDown).not.toHaveBeenCalled();
});
