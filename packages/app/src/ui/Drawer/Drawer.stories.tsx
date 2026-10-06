import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import { Dialog } from "../Dialog";
import { Drawer } from ".";
import type { DrawerSide, DrawerSize } from ".";

const Example: React.FC<{ side: DrawerSide; size: DrawerSize }> = ({
  side,
  size,
}) => (
  <Drawer.Root>
    <Drawer.Trigger
      render={
        <Button>
          {side} ({size})
        </Button>
      }
    />
    <Drawer.Popup side={side} size={size}>
      <Drawer.Header>
        <Drawer.Title>Scenes</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
            gap: "1rem",
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
      </Drawer.Body>
    </Drawer.Popup>
  </Drawer.Root>
);

const AllDrawers: React.FC = () => (
  <div style={{ display: "flex", gap: 12 }}>
    <Example side="left" size="lg" />
    <Example side="left" size="md" />
    <Example side="right" size="md" />
  </div>
);

const meta: Meta<typeof AllDrawers> = {
  title: "ui/Drawer",
  component: AllDrawers,
};
export default meta;

export const AllVariants: StoryObj<typeof AllDrawers> = {};

/** A dialog nested in the drawer dims it as well as the page. */
export const NestedDialog: StoryObj<typeof AllDrawers> = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger render={<Button>Open drawer</Button>} />
      <Drawer.Popup side="right" size="lg">
        <Drawer.Header>
          <Drawer.Title>Scenes</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Dialog.Root>
            <Dialog.Trigger render={<Button>Open dialog</Button>} />
            <Dialog.Popup size="sm">
              <Dialog.Header>
                <Dialog.Title>Sign in</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>Escape closes only this dialog.</p>
              </Dialog.Body>
            </Dialog.Popup>
          </Dialog.Root>
        </Drawer.Body>
      </Drawer.Popup>
    </Drawer.Root>
  ),
};
