import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { renderWithRouter } from "@/test_util/routerTesting";
import ButtonLink from "./ButtonLink";

test("with `to`, is a link that navigates through the router", async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  const { location } = await renderWithRouter(
    <ButtonLink
      to="/app/help/reference"
      ref={ref}
      variant="solid"
      tone="primary"
    >
      Next
    </ButtonLink>,
    { url: "/start" },
  );

  const link = screen.getByRole("link", { name: "Next" });
  expect(ref.current).toBe(link);
  expect(link).toHaveAttribute("href", "/app/help/reference");
  await user.click(link);
  expect(location.current.pathname).toBe("/app/help/reference");
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
