import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";
import type { ButtonVariant, ButtonTone, ButtonSize } from "./Button";

const variants: ButtonVariant[] = ["solid", "outline", "ghost"];
const tones: ButtonTone[] = ["neutral", "accent", "danger"];
const sizes: ButtonSize[] = ["sm", "md"];
const states = [
  "rest",
  "hover",
  "active",
  "focus-visible",
  "disabled",
  "loading",
] as const;

const PlusIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const cell: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };
const heading: React.CSSProperties = {
  ...cell,
  fontSize: 12,
  fontWeight: 400,
  color: "var(--color-text-light)",
};

const AllButtons: React.FC = () => (
  <div style={{ display: "grid", gap: 32 }}>
    <table style={{ borderCollapse: "collapse" }}>
      <caption style={{ ...heading, textAlign: "left" }}>
        States (size md)
      </caption>
      <thead>
        <tr>
          <th style={heading}>variant / tone</th>
          {states.map((state) => (
            <th key={state} style={heading}>
              {state}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {variants.flatMap((variant) =>
          tones.map((tone) => (
            <tr key={`${variant}-${tone}`}>
              <th style={heading}>
                {variant} / {tone}
              </th>
              {states.map((state) => (
                <td key={state} style={cell}>
                  <Button
                    variant={variant}
                    tone={tone}
                    data-pseudo={state}
                    disabled={state === "disabled"}
                    loading={state === "loading"}
                  >
                    Button
                  </Button>
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
    <table style={{ borderCollapse: "collapse" }}>
      <caption style={{ ...heading, textAlign: "left" }}>
        Sizes, with and without an icon
      </caption>
      <tbody>
        {sizes.map((size) => (
          <tr key={size}>
            <th style={heading}>{size}</th>
            {variants.map((variant) => (
              <React.Fragment key={variant}>
                <td style={cell}>
                  <Button size={size} variant={variant} tone="accent">
                    Save
                  </Button>
                </td>
                <td style={cell}>
                  <Button size={size} variant={variant} tone="accent">
                    <PlusIcon />
                    Add object
                  </Button>
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const meta: Meta<typeof AllButtons> = {
  title: "ui/Button",
  component: AllButtons,
};
export default meta;

export const AllVariants: StoryObj<typeof AllButtons> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      active: ['[data-pseudo="active"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
