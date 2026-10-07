import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Popover } from ".";

const keepFocus = (event: React.MouseEvent) => event.preventDefault();

const TestPopover = () => (
  <>
    <Popover.Root>
      <Popover.Trigger>Settings</Popover.Trigger>
      <Popover.Popup>
        <Popover.Title>Point Settings</Popover.Title>
        <input aria-label="Opacity" />
      </Popover.Popup>
    </Popover.Root>
    <button type="button">Elsewhere</button>
    {/* Stand-ins for MathLive's virtual keyboard and the app's toggle,
        which keep focus in the math field. */}
    <div className="ML__keyboard">
      <button type="button" onMouseDown={keepFocus}>
        7
      </button>
    </div>
    <div data-virtual-keyboard-control>
      <button type="button" onMouseDown={keepFocus}>
        Toggle keyboard
      </button>
    </div>
  </>
);

const openPopover = async () => {
  render(<TestPopover />);
  await user.click(screen.getByRole("button", { name: "Settings" }));
  const popover = await screen.findByRole("dialog", { name: "Point Settings" });
  await user.click(screen.getByRole("textbox", { name: "Opacity" }));
  return popover;
};

test("a press outside closes it", async () => {
  const popover = await openPopover();

  await user.click(screen.getByRole("button", { name: "Elsewhere" }));

  await waitFor(() => expect(popover).not.toBeInTheDocument());
});

test("tabbing out closes it", async () => {
  const popover = await openPopover();

  await user.tab();

  await waitFor(() => expect(popover).not.toBeInTheDocument());
});

test("pressing the virtual keyboard or its controls leaves it open", async () => {
  const popover = await openPopover();

  await user.click(screen.getByRole("button", { name: "7" }));
  await user.click(screen.getByRole("button", { name: "Toggle keyboard" }));

  expect(popover).toBeInTheDocument();
});
