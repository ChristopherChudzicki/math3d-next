import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Tooltip } from ".";

test("describes its trigger while open", async () => {
  render(
    <Tooltip.Root>
      <Tooltip.Trigger delay={0}>Show Graphic</Tooltip.Trigger>
      <Tooltip.Popup>Long press to change color</Tooltip.Popup>
    </Tooltip.Root>,
  );
  const trigger = screen.getByRole("button", { name: "Show Graphic" });
  expect(trigger).not.toHaveAccessibleDescription();

  await user.hover(trigger);

  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveTextContent("Long press to change color");
  expect(trigger).toHaveAccessibleDescription("Long press to change color");

  await user.unhover(trigger);

  await waitFor(() => expect(tooltip).not.toBeInTheDocument());
  expect(trigger).not.toHaveAccessibleDescription();
});
