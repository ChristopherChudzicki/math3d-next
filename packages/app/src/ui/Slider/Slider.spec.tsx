import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import Slider from "./Slider";

test("is a slider named by aria-label, and steps with the arrow keys", async () => {
  const onValueChange = vi.fn();
  render(
    <Slider
      aria-label="T"
      min={-5}
      max={5}
      step={0.5}
      defaultValue={0}
      onValueChange={onValueChange}
    />,
  );

  await user.tab();
  await user.keyboard("{ArrowRight}");

  expect(screen.getByRole("slider", { name: "T" })).toHaveFocus();
  expect(onValueChange).toHaveBeenLastCalledWith(0.5, expect.anything());
});
