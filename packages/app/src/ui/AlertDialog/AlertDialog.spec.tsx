import React from "react";
import { render, screen } from "@testing-library/react";
import Button from "../Button";
import { AlertDialog } from ".";

const ConfirmDelete: React.FC = () => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root open>
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
  render(<ConfirmDelete />);

  expect(
    await screen.findByRole("alertdialog", { name: "Delete scene?" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
});
