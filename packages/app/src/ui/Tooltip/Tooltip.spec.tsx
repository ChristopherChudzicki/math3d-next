import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Tooltip } from ".";

test("describes its trigger while open", async () => {
  render(
    <Tooltip.Root>
      <Tooltip.Trigger>Show Graphic</Tooltip.Trigger>
      <Tooltip.Popup>Press and hold to change color</Tooltip.Popup>
    </Tooltip.Root>,
  );
  const trigger = screen.getByRole("button", { name: "Show Graphic" });
  expect(trigger).not.toHaveAttribute("aria-describedby");

  await user.hover(trigger);

  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveTextContent("Press and hold to change color");
  expect(trigger).toHaveAccessibleDescription("Press and hold to change color");

  await user.unhover(trigger);

  await waitFor(() => expect(tooltip).not.toBeInTheDocument());
  expect(trigger).not.toHaveAttribute("aria-describedby");
});
