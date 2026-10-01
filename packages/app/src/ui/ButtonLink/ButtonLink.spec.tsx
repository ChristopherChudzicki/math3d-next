import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ButtonLink from "./ButtonLink";

test("with `to`, is a link that navigates through the router", async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route
          path="/start"
          element={
            <ButtonLink to="/next" ref={ref} variant="solid" tone="accent">
              Next
            </ButtonLink>
          }
        />
        <Route path="/next" element={<h1>Next page</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  const link = screen.getByRole("link", { name: "Next" });
  expect(ref.current).toBe(link);
  expect(link).toHaveAttribute("href", "/next");
  await user.click(link);
  expect(screen.getByRole("heading", { name: "Next page" })).toBeVisible();
});

test("with `href`, is a plain link that works outside a router", () => {
  render(<ButtonLink href="/elsewhere">Elsewhere</ButtonLink>);

  // A link, not a link-shaped button: no role="button" from Base UI.
  expect(screen.getByRole("link", { name: "Elsewhere" })).toHaveAttribute(
    "href",
    "/elsewhere",
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("with `href`, forwards its ref and merges its className", () => {
  const ref = React.createRef<HTMLAnchorElement>();
  render(
    <ButtonLink href="/x" ref={ref} className="extra">
      X
    </ButtonLink>,
  );

  const link = screen.getByRole("link", { name: "X" });
  expect(ref.current).toBe(link);
  expect(link).toHaveClass("extra");
});
