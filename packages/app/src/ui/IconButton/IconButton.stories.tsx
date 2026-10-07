import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@iconify/react/offline";
import x from "@iconify-icons/lucide/x";
import keyboard from "@iconify-icons/lucide/keyboard";
import chevronUp from "@iconify-icons/lucide/chevron-up";
import IconButton from "./IconButton";
import type { ButtonVariant, ButtonTone, ButtonSize } from "../Button";

const variants: ButtonVariant[] = ["ghost", "outline", "solid"];
const tones: ButtonTone[] = ["neutral", "primary", "danger"];
const sizes: ButtonSize[] = ["sm", "md"];
const states = [
  "rest",
  "hover",
  "active",
  "focus-visible",
  "disabled",
] as const;

const cell: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };
const heading: React.CSSProperties = {
  ...cell,
  fontSize: 12,
  fontWeight: 400,
  color: "var(--color-text-light)",
};

const AllIconButtons: React.FC = () => (
  <table style={{ borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={heading}>variant / tone</th>
        {sizes.flatMap((size) =>
          states.map((state) => (
            <th key={`${size}-${state}`} style={heading}>
              {size} {state}
            </th>
          )),
        )}
      </tr>
    </thead>
    <tbody>
      {variants.flatMap((variant) =>
        tones.map((tone) => (
          <tr key={`${variant}-${tone}`}>
            <th style={heading}>
              {variant} / {tone}
            </th>
            {sizes.flatMap((size) =>
              states.map((state) => (
                <td key={`${size}-${state}`} style={cell}>
                  <IconButton
                    label="Close"
                    variant={variant}
                    tone={tone}
                    size={size}
                    data-pseudo={state}
                    disabled={state === "disabled"}
                  >
                    <Icon icon={x} />
                  </IconButton>
                </td>
              )),
            )}
          </tr>
        )),
      )}
    </tbody>
  </table>
);

const meta: Meta<typeof AllIconButtons> = {
  title: "ui/IconButton",
  component: AllIconButtons,
};
export default meta;

export const AllVariants: StoryObj<typeof AllIconButtons> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      active: ['[data-pseudo="active"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};

/** One icon is square; a second widens the button. */
export const TwoIcons: StoryObj<typeof AllIconButtons> = {
  render: () => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {sizes.map((size) => (
        <IconButton
          key={size}
          label="Enable math keyboard"
          variant="solid"
          size={size}
        >
          <Icon icon={keyboard} aria-hidden="true" />
          <Icon icon={chevronUp} aria-hidden="true" />
        </IconButton>
      ))}
    </div>
  ),
};
