import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import TextLink, { TextButton } from ".";

const states = ["rest", "hover", "focus-visible"] as const;

const cell: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };
const heading: React.CSSProperties = {
  ...cell,
  fontSize: 12,
  fontWeight: 400,
  color: "var(--color-text-light)",
};

const AllTextLinks: React.FC = () => (
  <MemoryRouter>
    <div style={{ display: "grid", gap: 32 }}>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={heading}>component</th>
            {states.map((state) => (
              <th key={state} style={heading}>
                {state}
              </th>
            ))}
            <th style={heading}>disabled</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={heading}>TextLink (to)</th>
            {states.map((state) => (
              <td key={state} style={cell}>
                <TextLink to="/" data-pseudo={state}>
                  Back to Math3d
                </TextLink>
              </td>
            ))}
            <td style={heading}>(a link can&apos;t be)</td>
          </tr>
          <tr>
            <th style={heading}>TextButton</th>
            {states.map((state) => (
              <td key={state} style={cell}>
                <TextButton data-pseudo={state}>Show more</TextButton>
              </td>
            ))}
            <td style={cell}>
              <TextButton disabled>Show more</TextButton>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ maxWidth: "32rem" }}>
        <p style={{ ...heading, padding: 0 }}>In running text</p>
        <p>
          This scene was created with an older version of Math3d. If it does not
          load, please{" "}
          <TextLink href="https://example.com" target="_blank" rel="noreferrer">
            report an issue
          </TextLink>
          . <TextButton>Sign in</TextButton> to save scenes you can keep
          editing.
        </p>
      </div>
    </div>
  </MemoryRouter>
);

const meta: Meta<typeof AllTextLinks> = {
  title: "ui/TextLink",
  component: AllTextLinks,
};
export default meta;

export const AllVariants: StoryObj<typeof AllTextLinks> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
