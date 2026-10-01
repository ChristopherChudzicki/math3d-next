import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import { AlertDialog } from ".";

const ConfirmDelete: React.FC = () => {
  const [open, setOpen] = React.useState(true);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button tone="danger" onClick={() => setOpen(true)}>
        Delete…
      </Button>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Popup initialFocus={cancelRef}>
          <AlertDialog.Title>Delete scene?</AlertDialog.Title>
          <AlertDialog.Description>
            Delete &ldquo;Parametric surfaces&rdquo;? This can&rsquo;t be
            undone.
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close
              render={<Button ref={cancelRef}>Cancel</Button>}
            />
            <Button
              variant="solid"
              tone="danger"
              onClick={() => setOpen(false)}
            >
              Delete
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Popup>
      </AlertDialog.Root>
    </>
  );
};

const meta: Meta<typeof ConfirmDelete> = {
  title: "ui/AlertDialog",
  component: ConfirmDelete,
};
export default meta;

export const Destructive: StoryObj<typeof ConfirmDelete> = {};
