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

test("Form submits from the footer's submit button and from Enter in a field", async () => {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(
    <Dialog.Root open>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>Save scene</Dialog.Title>
        </Dialog.Header>
        <Dialog.Form onSubmit={onSubmit}>
          <Dialog.Body>
            <input aria-label="Title" />
          </Dialog.Body>
          <Dialog.Actions>
            <Dialog.Close render={<Button>Cancel</Button>} />
            <Button type="submit">Save</Button>
          </Dialog.Actions>
        </Dialog.Form>
      </Dialog.Popup>
    </Dialog.Root>,
  );

  await user.click(await screen.findByRole("button", { name: "Save" }));
  await user.type(screen.getByRole("textbox", { name: "Title" }), "{Enter}");
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onSubmit).toHaveBeenCalledTimes(2);
});

test("closeDisabled disables the header's close button", async () => {
  render(
    <Dialog.Root open>
      <Dialog.Popup>
        <Dialog.Header closeDisabled>
          <Dialog.Title>Saving</Dialog.Title>
        </Dialog.Header>
      </Dialog.Popup>
    </Dialog.Root>,
  );

  expect(await screen.findByRole("button", { name: "Close" })).toBeDisabled();
});
