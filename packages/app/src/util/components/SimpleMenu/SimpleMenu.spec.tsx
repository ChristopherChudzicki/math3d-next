import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import type { LinkProps } from "react-router-dom";
import SimpleMenu from "./SimpleMenu";
import type { SimpleMenuItem } from "./SimpleMenu";

// Mock react-router-dom's Link so we don't need to set up a Router
vi.mock("react-router-dom", () => {
  return {
    Link: vi.fn(({ children, ...others }: LinkProps) => {
      return (
        <a
          {...others}
          data-prop-to={others.to}
          data-react-component="react-router-dom-link"
        >
          {children}
        </a>
      );
    }),
  };
});

describe("SimpleMenu", () => {
  it("Opens the menu when trigger is clicked", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", onClick: vi.fn() },
    ];

    render(
      <SimpleMenu
        trigger={<button type="button">Open Menu</button>}
        items={items}
      />,
    );

    expect(screen.queryByRole("menu")).toBe(null);
    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    expect(screen.queryByRole("menu")).not.toBe(null);
  });

  it("Calls the menuitem's event andler when clicked and closes menu", async () => {
    const items = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", onClick: vi.fn() },
    ] satisfies SimpleMenuItem[];

    render(
      <SimpleMenu
        trigger={<button type="button">Open Menu</button>}
        items={items}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    const menu = screen.getByRole("menu");

    await user.click(screen.getByRole("menuitem", { name: "Item 1" }));
    expect(items[0].onClick).toHaveBeenCalled();
    expect(items[1].onClick).not.toHaveBeenCalled();

    expect(menu).not.toBeInTheDocument();
  });

  it("Calls the trigger's event handler when clicked, in addition to opening the menu", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", onClick: vi.fn() },
    ];

    const triggerHandler = vi.fn();
    render(
      <SimpleMenu
        trigger={
          <button type="button" onClick={triggerHandler}>
            Open Menu
          </button>
        }
        items={items}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    const menu = screen.getByRole("menu");
    expect(menu).toBeVisible();
    expect(triggerHandler).toHaveBeenCalled();
  });

  it("Calls onVisibilityChange when menu opens/closes", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", onClick: vi.fn() },
    ];

    const visibilityHandler = vi.fn();
    render(
      <SimpleMenu
        onVisibilityChange={visibilityHandler}
        trigger={<button type="button">Open Menu</button>}
        items={items}
      />,
    );

    expect(visibilityHandler).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    expect(visibilityHandler).toHaveBeenCalledTimes(1);
    expect(visibilityHandler).toHaveBeenCalledWith(true);

    visibilityHandler.mockClear();

    await user.click(screen.getByRole("menuitem", { name: "Item 1" }));
    expect(visibilityHandler).toHaveBeenCalledTimes(1);
    expect(visibilityHandler).toHaveBeenCalledWith(false);

    visibilityHandler.mockClear();
  });

  it("Renders link items using React Router's Link", async () => {
    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", href: "./woof" },
    ];

    render(
      <SimpleMenu
        trigger={<button type="button">Open Menu</button>}
        items={items}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    const item2 = screen.getByRole("menuitem", { name: "Item 2" });
    expect(item2.dataset.reactComponent).toBe("react-router-dom-link");
    expect(item2.dataset.propTo).toBe("./woof");
  });

  it("Renders link with custom LinkComponent if specified", async () => {
    const LinkComponent: React.FC<React.ComponentProps<"a">> = ({
      children,
      ...others
    }) => {
      return (
        <a {...others} data-react-component="custom-link">
          {children}
        </a>
      );
    };

    const items: SimpleMenuItem[] = [
      { key: "one", label: "Item 1", onClick: vi.fn() },
      { key: "two", label: "Item 2", href: "./woof", LinkComponent },
    ];

    render(
      <SimpleMenu
        trigger={<button type="button">Open Menu</button>}
        items={items}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    const item2 = screen.getByRole("menuitem", { name: "Item 2" });
    expect(item2.dataset.reactComponent).toBe("custom-link");
    expect((item2 as HTMLAnchorElement).href).toBe(`${window.origin}/woof`);
  });
});
