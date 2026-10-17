import React from "react";
import { expect, onTestFinished, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Toaster, { createToastManager } from "./Toaster";

// F6 focuses the viewport itself; Escape there must not reach the `document`
// listener that closes the dialog or drawer beneath.
test("Escape on the toast viewport doesn't reach the document", () => {
  const toastManager = createToastManager();
  render(<Toaster toastManager={toastManager} />);
  act(() => {
    toastManager.add({ description: "Couldn’t save.", timeout: 0 });
  });
  const onKeyDown = vi.fn();
  document.addEventListener("keydown", onKeyDown);
  onTestFinished(() => document.removeEventListener("keydown", onKeyDown));

  fireEvent.keyDown(screen.getByRole("region", { name: "Notifications" }), {
    key: "Escape",
  });
  expect(onKeyDown).not.toHaveBeenCalled();
});
