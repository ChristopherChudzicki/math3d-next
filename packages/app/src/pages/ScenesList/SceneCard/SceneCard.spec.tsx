import React from "react";
import { render, screen, within } from "@testing-library/react";
import user from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import SceneCard from "./SceneCard";
import type { SceneCardProps } from "./SceneCard";

const setupCard = (props: Partial<SceneCardProps> = {}) => {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <ul>
            <SceneCard title="Parametric surfaces" to="/abc" {...props} />
          </ul>
        ),
      },
    ],
    { initialEntries: ["/start"] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

test("the link is named by the title alone and described by the meta line", () => {
  setupCard({
    modifiedDate: "2026-09-01T12:00:00Z",
    archived: true,
    current: true,
  });

  const link = screen.getByRole("link", { name: "Parametric surfaces" });
  expect(link).toHaveAttribute("href", "/abc");
  expect(link).toHaveAttribute("aria-current", "page");
  expect(link).toHaveAccessibleDescription(/Last modified.*Archived/);
});

test("actions are a sibling of the link, not inside it", () => {
  setupCard({ actions: <button type="button">Actions</button> });

  const link = screen.getByRole("link", { name: "Parametric surfaces" });
  expect(within(link).queryByRole("button")).toBeNull();
  expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
});

test("a plain click on the current scene's card doesn't navigate", async () => {
  const router = setupCard({ current: true });

  await user.click(screen.getByRole("link", { name: "Parametric surfaces" }));

  expect(router.state.location.pathname).toBe("/start");
});
