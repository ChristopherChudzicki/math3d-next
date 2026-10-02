import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Checkbox from "./Checkbox";

const states = ["rest", "hover", "focus-visible", "disabled"] as const;

const AllCheckboxes: React.FC = () => (
  <table style={{ borderCollapse: "collapse" }}>
    <tbody>
      {[false, true].map((checked) => (
        <tr key={String(checked)}>
          {states.map((state) => (
            <td key={state} style={{ padding: "4px 16px 4px 0" }}>
              <Checkbox
                label={`${checked ? "checked" : "unchecked"} ${state}`}
                defaultChecked={checked}
                disabled={state === "disabled"}
                data-pseudo={state}
                className={state === "hover" ? "pseudo-hover-label" : undefined}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const meta: Meta<typeof AllCheckboxes> = {
  title: "ui/Checkbox",
  component: AllCheckboxes,
};
export default meta;

export const AllVariants: StoryObj<typeof AllCheckboxes> = {
  parameters: {
    pseudo: {
      // Hover is styled from the label, so force it there.
      hover: [".pseudo-hover-label"],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
