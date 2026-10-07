import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import { Dialog } from ".";

/** Confirmations that interrupt use AlertDialog; this is the same footer. */
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
        <Dialog.Close render={<Button>Cancel</Button>} />
        <Button variant="solid" tone="danger">
          Delete
        </Button>
      </Dialog.Actions>
    </Dialog.Popup>
  </Dialog.Root>
);

const FormSubmit: React.FC = () => {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button>Form submit (md)</Button>} />
      {/* Form dialogs start on their first field, not the close button. */}
      <Dialog.Popup size="md" initialFocus={titleRef}>
        <Dialog.Header>
          <Dialog.Title>Save scene</Dialog.Title>
          <Dialog.Description>Give your scene a title.</Dialog.Description>
        </Dialog.Header>
        {/* The form wraps Body and Actions, so Enter or Save submits it. */}
        <Dialog.Form
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
        >
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
            <Dialog.Close render={<Button>Cancel</Button>} />
            <Button type="submit" variant="solid" tone="primary">
              Save
            </Button>
          </Dialog.Actions>
        </Dialog.Form>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

const CopyLink: React.FC = () => {
  const copyRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button>Copy link (sm)</Button>} />
      <Dialog.Popup size="sm" initialFocus={copyRef}>
        <Dialog.Header>
          <Dialog.Title>Scene saved!</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <code>https://math3d.org/abc123</code>
        </Dialog.Body>
        <Dialog.Actions>
          <Dialog.Close render={<Button>Done</Button>} />
          <Button ref={copyRef} variant="solid" tone="primary">
            Copy link
          </Button>
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

const Informational: React.FC = () => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button>Informational (sm)</Button>} />
    <Dialog.Popup size="sm">
      <Dialog.Header>
        <Dialog.Title>Legacy Scene</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        This scene was created with an older version of Math3d.
      </Dialog.Body>
      <Dialog.Actions>
        <Dialog.Close render={<Button>OK</Button>} />
      </Dialog.Actions>
    </Dialog.Popup>
  </Dialog.Root>
);

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

/** The standard footers, primary action last; then a large, scrolling body. */
const AllDialogs: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
    <Confirm />
    <FormSubmit />
    <CopyLink />
    <Informational />
    <Browse />
  </div>
);

const meta: Meta<typeof AllDialogs> = {
  title: "ui/Dialog",
  component: AllDialogs,
};
export default meta;

export const AllVariants: StoryObj<typeof AllDialogs> = {};
