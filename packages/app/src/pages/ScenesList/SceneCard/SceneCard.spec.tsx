import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import user from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
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

describe("the thumbnail", () => {
  const IMAGE_URL = "https://s.test/screenshots/scene/abc.png?fallback=none";
  // alt="" gives the <img> the presentation role. The placeholder beneath it
  // is always rendered; without the <img>, it is all that shows.
  const thumbnail = () => screen.queryByRole("presentation");

  test("is hidden until it loads, then revealed", () => {
    setupCard({ imageUrl: IMAGE_URL });
    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute("src", IMAGE_URL);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("data-loaded");

    fireEvent.load(img);

    expect(img).toHaveAttribute("data-loaded");
  });

  test("goes away on error, leaving the placeholder", () => {
    setupCard({ imageUrl: IMAGE_URL });

    fireEvent.error(screen.getByRole("presentation"));

    expect(thumbnail()).toBeNull();
  });

  test("starts over when its URL changes, e.g. after the scene is saved", () => {
    const card = (imageUrl: string) => (
      <MemoryRouter>
        <ul>
          <SceneCard
            title="Parametric surfaces"
            to="/abc"
            imageUrl={imageUrl}
          />
        </ul>
      </MemoryRouter>
    );
    const { rerender } = render(card(`${IMAGE_URL}&v=1`));
    fireEvent.error(screen.getByRole("presentation"));
    expect(thumbnail()).toBeNull();

    rerender(card(`${IMAGE_URL}&v=2`));

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      `${IMAGE_URL}&v=2`,
    );
  });

  test("is absent without an imageUrl, leaving the placeholder", () => {
    setupCard({ imageUrl: null });

    expect(thumbnail()).toBeNull();
  });
});
