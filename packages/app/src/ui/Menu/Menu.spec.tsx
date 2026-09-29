import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Menu } from ".";

test("choosing an item runs it and closes the menu", async () => {
  const onClick = vi.fn();
  render(
    <Menu.Root>
      <Menu.Trigger>Menu</Menu.Trigger>
      <Menu.Popup>
        <Menu.Item onClick={onClick}>Examples</Menu.Item>
        <Menu.LinkItem href="/reference">Function Reference</Menu.LinkItem>
      </Menu.Popup>
    </Menu.Root>,
  );

  await user.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("menu");
  expect(
    screen.getByRole("menuitem", { name: "Function Reference" }),
  ).toHaveAttribute("href", "/reference");

  await user.click(screen.getByRole("menuitem", { name: "Examples" }));

  expect(onClick).toHaveBeenCalledOnce();
  await waitFor(() => expect(menu).not.toBeInTheDocument());
});
