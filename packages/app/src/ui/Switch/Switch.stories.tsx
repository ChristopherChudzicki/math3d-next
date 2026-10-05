import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Switch from "./Switch";

const states = ["rest", "hover", "focus-visible", "disabled"] as const;

const AllSwitches: React.FC = () => (
  <table style={{ borderCollapse: "collapse" }}>
    <tbody>
      {[false, true].map((checked) => (
        <tr key={String(checked)}>
          {states.map((state) => (
            <td key={state} style={{ padding: "8px 24px 8px 0" }}>
              <Switch
                aria-label={`${checked ? "on" : "off"} ${state}`}
                defaultChecked={checked}
                disabled={state === "disabled"}
                data-pseudo={state}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const meta: Meta<typeof AllSwitches> = {
  title: "ui/Switch",
  component: AllSwitches,
};
export default meta;

export const AllVariants: StoryObj<typeof AllSwitches> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
