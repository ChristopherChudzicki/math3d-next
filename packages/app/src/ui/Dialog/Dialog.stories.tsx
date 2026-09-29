import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import { Dialog } from ".";

const Confirm: React.FC = () => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button>Confirm (sm)</Button>} />
    <Dialog.Popup size="sm">
      <Dialog.Header>
        <Dialog.Title>Delete this scene?</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          &ldquo;Saddle surface&rdquo; will be deleted. This can&rsquo;t be
          undone.
        </Dialog.Description>
      </Dialog.Body>
      <Dialog.Actions>
        <Dialog.Close render={<Button variant="ghost">Cancel</Button>} />
        <Button variant="solid" tone="danger">
          Delete
        </Button>
      </Dialog.Actions>
    </Dialog.Popup>
  </Dialog.Root>
);

const Form: React.FC = () => {
  const titleRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button>Form (md)</Button>} />
      {/* Form dialogs start on their first field, not the close button. */}
      <Dialog.Popup size="md" initialFocus={titleRef}>
        <Dialog.Header>
          <Dialog.Title>Save scene</Dialog.Title>
          <Dialog.Description>Give your scene a title.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <label
            htmlFor="dialog-story-title"
            style={{ display: "grid", gap: 4 }}
          >
            Title
            <input
              ref={titleRef}
              id="dialog-story-title"
              defaultValue="Untitled"
              style={{ font: "inherit" }}
            />
          </label>
        </Dialog.Body>
        <Dialog.Actions>
          <Dialog.Close render={<Button variant="ghost">Cancel</Button>} />
          <Button variant="solid" tone="accent">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

const Browse: React.FC = () => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button>Browse (lg, scrolling)</Button>} />
    <Dialog.Popup size="lg">
      <Dialog.Header>
        <Dialog.Title>My Scenes</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "4 / 3",
                borderRadius: 8,
                background: "var(--color-secondary-lighter)",
                display: "grid",
                placeItems: "center",
              }}
            >
              Scene {i + 1}
            </div>
          ))}
        </div>
      </Dialog.Body>
    </Dialog.Popup>
  </Dialog.Root>
);

const AllDialogs: React.FC = () => (
  <div style={{ display: "flex", gap: 12 }}>
    <Confirm />
    <Form />
    <Browse />
  </div>
);

const meta: Meta<typeof AllDialogs> = {
  title: "ui/Dialog",
  component: AllDialogs,
};
export default meta;

export const AllVariants: StoryObj<typeof AllDialogs> = {};
