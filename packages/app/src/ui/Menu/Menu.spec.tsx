import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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

test("choosing a link item closes the menu", async () => {
  render(
    <Menu.Root>
      <Menu.Trigger>Menu</Menu.Trigger>
      <Menu.Popup>
        {/* Client-side routers cancel the browser navigation, as here. */}
        <Menu.LinkItem href="/reference" onClick={(e) => e.preventDefault()}>
          Function Reference
        </Menu.LinkItem>
      </Menu.Popup>
    </Menu.Root>,
  );
  await user.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("menu");

  await user.click(
    screen.getByRole("menuitem", { name: "Function Reference" }),
  );

  await waitFor(() => expect(menu).not.toBeInTheDocument());
});

test("a radio group is named by its label, and choosing an item closes the menu", async () => {
  const onValueChange = vi.fn();
  render(
    <Menu.Root>
      <Menu.Trigger>Menu</Menu.Trigger>
      <Menu.Popup>
        <Menu.RadioGroup value="a" onValueChange={onValueChange}>
          <Menu.GroupLabel>Renderer</Menu.GroupLabel>
          <Menu.RadioItem value="a">First</Menu.RadioItem>
          <Menu.RadioItem value="b" description="Faster">
            Second
          </Menu.RadioItem>
        </Menu.RadioGroup>
      </Menu.Popup>
    </Menu.Root>,
  );
  await user.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("menu");
  const group = screen.getByRole("group", { name: "Renderer" });
  const first = within(group).getByRole("menuitemradio", { name: "First" });
  const second = within(group).getByRole("menuitemradio", { name: "Second" });
  expect(first).toBeChecked();
  expect(second).not.toBeChecked();
  expect(second).toHaveAccessibleDescription("Faster");

  await user.click(second);

  expect(onValueChange).toHaveBeenCalledExactlyOnceWith("b", expect.anything());
  await waitFor(() => expect(menu).not.toBeInTheDocument());
});
