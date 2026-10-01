import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import TextLink, { TextButton } from ".";

test("TextLink routes with `to` and is a plain anchor with `href`", () => {
  render(
    <MemoryRouter>
      <TextLink to="/app/help">Help</TextLink>
      <TextLink href="https://example.com" target="_blank" rel="noreferrer">
        Elsewhere
      </TextLink>
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute(
    "href",
    "/app/help",
  );
  expect(screen.getByRole("link", { name: "Elsewhere" })).toHaveAttribute(
    "target",
    "_blank",
  );
});

test("TextButton is a button that does not submit an enclosing form", async () => {
  const onClick = vi.fn();
  const onSubmit = vi.fn((e: React.SyntheticEvent) => e.preventDefault());
  render(
    <form onSubmit={onSubmit}>
      <TextButton onClick={onClick}>Sign in</TextButton>
    </form>,
  );

  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(onClick).toHaveBeenCalledOnce();
  expect(onSubmit).not.toHaveBeenCalled();
});
