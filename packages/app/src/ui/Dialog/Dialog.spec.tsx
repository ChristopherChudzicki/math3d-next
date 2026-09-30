import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import user from "@testing-library/user-event";
import Button from "../Button";
import { Dialog } from ".";

const TestDialog = () => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button>Open</Button>} />
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

test("the header's close button closes it and returns focus to the trigger", async () => {
  render(<TestDialog />);
  const trigger = screen.getByRole("button", { name: "Open" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Save scene" });

  await user.click(screen.getByRole("button", { name: "Close" }));

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});
