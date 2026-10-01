import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import Checkbox from "./Checkbox";

test("is named by its label, and clicking the label text toggles it", async () => {
  const onCheckedChange = vi.fn();
  render(
    <Checkbox label="Include archived" onCheckedChange={onCheckedChange} />,
  );

  await user.click(screen.getByText("Include archived"));

  expect(
    screen.getByRole("checkbox", { name: "Include archived" }),
  ).toBeChecked();
  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});
