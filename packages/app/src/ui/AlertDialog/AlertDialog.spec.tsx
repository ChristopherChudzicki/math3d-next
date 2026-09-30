import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import Button from "../Button";
import { AlertDialog } from ".";

const ConfirmDelete: React.FC<{
  onOpenChange: AlertDialog.RootProps["onOpenChange"];
}> = ({ onOpenChange }) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root open onOpenChange={onOpenChange}>
      <AlertDialog.Popup initialFocus={cancelRef}>
        <AlertDialog.Title>Delete scene?</AlertDialog.Title>
        <AlertDialog.Actions>
          <AlertDialog.Close render={<Button ref={cancelRef}>Cancel</Button>} />
          <Button variant="solid" tone="danger">
            Delete
          </Button>
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
};

test("is an alertdialog named by its title, focusing the given element", async () => {
  render(<ConfirmDelete onOpenChange={vi.fn()} />);

  expect(
    await screen.findByRole("alertdialog", { name: "Delete scene?" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
});

test("Close asks to close", async () => {
  const onOpenChange = vi.fn();
  render(<ConfirmDelete onOpenChange={onOpenChange} />);

  await user.click(await screen.findByRole("button", { name: "Cancel" }));

  expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
});
