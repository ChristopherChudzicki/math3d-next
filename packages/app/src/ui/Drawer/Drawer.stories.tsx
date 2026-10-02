import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
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
