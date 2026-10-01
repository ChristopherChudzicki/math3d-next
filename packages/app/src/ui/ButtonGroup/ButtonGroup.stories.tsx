import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@iconify/react/offline";
import chevronDown from "@iconify-icons/lucide/chevron-down";
import minus from "@iconify-icons/lucide/minus";
import plus from "@iconify-icons/lucide/plus";
import ButtonGroup from "./ButtonGroup";
import Button from "../Button";
import IconButton from "../IconButton";
import type { ButtonVariant } from "../Button";

const variants: ButtonVariant[] = ["outline", "solid", "ghost"];

const cell: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };
const heading: React.CSSProperties = {
  ...cell,
  fontSize: 12,
  fontWeight: 400,
  color: "var(--color-text-light)",
};

const readout: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "3rem",
  border: "1px solid var(--color-secondary-light)",
  backgroundColor: "var(--color-secondary-lighter)",
  fontSize: "var(--font-size-small)",
};

const AllButtonGroups: React.FC = () => (
  <table style={{ borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={heading}>variant</th>
        <th style={heading}>split button</th>
        <th style={heading}>split button, loading</th>
        <th style={heading}>split button, trigger hovered</th>
        <th style={heading}>icon buttons around a readout</th>
        <th style={heading}>icon buttons, one disabled, focus-visible</th>
      </tr>
    </thead>
    <tbody>
      {variants.map((variant) => (
        <tr key={variant}>
          <th style={heading}>{variant}</th>
          <td style={cell}>
            <ButtonGroup>
              <Button variant={variant} tone="accent">
                Save
              </Button>
              <IconButton variant={variant} tone="accent" label="More actions">
                <Icon icon={chevronDown} aria-hidden="true" />
              </IconButton>
            </ButtonGroup>
          </td>
          <td style={cell}>
            <ButtonGroup>
              <Button variant={variant} tone="accent" loading>
                Saving...
              </Button>
              <IconButton
                variant={variant}
                tone="accent"
                label="More actions"
                disabled
              >
                <Icon icon={chevronDown} aria-hidden="true" />
              </IconButton>
            </ButtonGroup>
          </td>
          <td style={cell}>
            <ButtonGroup>
              <Button variant={variant} tone="accent">
                Save
              </Button>
              <IconButton
                variant={variant}
                tone="accent"
                label="More actions"
                data-pseudo="hover"
              >
                <Icon icon={chevronDown} aria-hidden="true" />
              </IconButton>
            </ButtonGroup>
          </td>
          <td style={cell}>
            <ButtonGroup aria-label="Speed">
              <IconButton variant={variant} size="sm" label="Slower">
                <Icon icon={minus} aria-hidden="true" />
              </IconButton>
              <output style={readout}>1x</output>
              <IconButton variant={variant} size="sm" label="Faster">
                <Icon icon={plus} aria-hidden="true" />
              </IconButton>
            </ButtonGroup>
          </td>
          <td style={cell}>
            <ButtonGroup aria-label="Step">
              <IconButton variant={variant} size="sm" label="Back" disabled>
                <Icon icon={minus} aria-hidden="true" />
              </IconButton>
              <IconButton
                variant={variant}
                size="sm"
                label="Forward"
                data-pseudo="focus-visible"
              >
                <Icon icon={plus} aria-hidden="true" />
              </IconButton>
            </ButtonGroup>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const meta: Meta<typeof AllButtonGroups> = {
  title: "ui/ButtonGroup",
  component: AllButtonGroups,
};
export default meta;

export const AllVariants: StoryObj<typeof AllButtonGroups> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
