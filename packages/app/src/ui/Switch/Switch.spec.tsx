import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import Switch from "./Switch";

test("is a switch named by aria-label, and reports toggling", async () => {
  const onCheckedChange = vi.fn();
  render(<Switch aria-label="Visible" onCheckedChange={onCheckedChange} />);

  await user.click(screen.getByRole("switch", { name: "Visible" }));

  expect(screen.getByRole("switch", { name: "Visible" })).toBeChecked();
  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});
