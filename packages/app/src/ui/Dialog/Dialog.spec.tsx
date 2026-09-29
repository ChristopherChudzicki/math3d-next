import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Dialog } from ".";

const TestDialog = () => (
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Popup>
      <Dialog.Header>
        <Dialog.Title>Save scene</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <input aria-label="Title" />
      </Dialog.Body>
    </Dialog.Popup>
  </Dialog.Root>
);

test("opens named by its title, with focus inside", async () => {
  render(<TestDialog />);

  await user.click(screen.getByRole("button", { name: "Open" }));

  const dialog = await screen.findByRole("dialog", { name: "Save scene" });
  await waitFor(() =>
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus(),
  );
});

test("the header's close button closes and unmounts it", async () => {
  render(<TestDialog />);
  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Save scene" });

  await user.click(screen.getByRole("button", { name: "Close" }));

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
});
