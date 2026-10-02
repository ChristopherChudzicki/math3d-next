import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import TextLink, { TextButton } from ".";

test("TextLink with `to` navigates through the router", async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route
          path="/start"
          element={
            <TextLink to="/app/help" ref={ref}>
              Help
            </TextLink>
          }
        />
        <Route path="/app/help" element={<h1>Help page</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  const link = screen.getByRole("link", { name: "Help" });
  expect(ref.current).toBe(link);
  await user.click(link);
  expect(screen.getByRole("heading", { name: "Help page" })).toBeVisible();
});

test("TextLink with `href` is a plain anchor that works outside a router", () => {
  render(
    <TextLink href="https://example.com" target="_blank" rel="noreferrer">
      Elsewhere
    </TextLink>,
  );

  const link = screen.getByRole("link", { name: "Elsewhere" });
  expect(link).toHaveAttribute("href", "https://example.com");
  expect(link).toHaveAttribute("target", "_blank");
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
