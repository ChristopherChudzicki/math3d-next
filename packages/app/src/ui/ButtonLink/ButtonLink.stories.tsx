import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { Icon } from "@iconify/react/offline";
import externalLink from "@iconify-icons/lucide/external-link";
import ButtonLink from "./ButtonLink";
import type { ButtonVariant, ButtonTone, ButtonSize } from "../Button";

const variants: ButtonVariant[] = ["solid", "outline", "ghost"];
const tones: ButtonTone[] = ["neutral", "accent", "danger"];
const sizes: ButtonSize[] = ["sm", "md"];
const states = ["rest", "hover", "active", "focus-visible"] as const;

const cell: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };
const heading: React.CSSProperties = {
  ...cell,
  fontSize: 12,
  fontWeight: 400,
  color: "var(--color-text-light)",
};

const AllButtonLinks: React.FC = () => (
  <MemoryRouter>
    <div style={{ display: "grid", gap: 32 }}>
      <table style={{ borderCollapse: "collapse" }}>
        <caption style={{ ...heading, textAlign: "left" }}>
          States (router mode, size md)
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
                    <ButtonLink
                      to="/"
                      variant={variant}
                      tone={tone}
                      data-pseudo={state}
                    >
                      Link
                    </ButtonLink>
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
      <table style={{ borderCollapse: "collapse" }}>
        <caption style={{ ...heading, textAlign: "left" }}>
          Sizes; plain href mode with an icon
        </caption>
        <tbody>
          {sizes.map((size) => (
            <tr key={size}>
              <th style={heading}>{size}</th>
              <td style={cell}>
                <ButtonLink to="/" size={size}>
                  Back to Math3d
                </ButtonLink>
              </td>
              <td style={cell}>
                <ButtonLink
                  href="https://example.com"
                  target="_blank"
                  rel="noreferrer"
                  size={size}
                  variant="ghost"
                  tone="accent"
                >
                  Open site
                  <Icon icon={externalLink} aria-hidden="true" />
                </ButtonLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </MemoryRouter>
);

const meta: Meta<typeof AllButtonLinks> = {
  title: "ui/ButtonLink",
  component: AllButtonLinks,
};
export default meta;

export const AllVariants: StoryObj<typeof AllButtonLinks> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      active: ['[data-pseudo="active"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
