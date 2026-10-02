import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  const { container } = render(<RouterProvider router={router} />);
  return { router, container };
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
  const { router } = setupCard({ current: true });

  await user.click(screen.getByRole("link", { name: "Parametric surfaces" }));

  expect(router.state.location.pathname).toBe("/start");
});

describe("the thumbnail", () => {
  const IMAGE_URL = "https://s.test/screenshots/scene/abc.png?fallback=none";
  // alt="" makes the <img> presentational, so it has no role to query by.
  const thumbnail = (container: HTMLElement) =>
    container.querySelector<HTMLImageElement>("img");
  const placeholderIcon = (container: HTMLElement) =>
    container.querySelector("svg");

  test("sits over the placeholder, hidden until it loads, then revealed", () => {
    const { container } = setupCard({ imageUrl: IMAGE_URL });
    const img = thumbnail(container);
    expect(img).toHaveAttribute("src", IMAGE_URL);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("data-loaded");
    expect(placeholderIcon(container)).toBeInTheDocument();

    fireEvent.load(img!);

    expect(img).toHaveAttribute("data-loaded");
  });

  test("goes away on error, leaving the placeholder", () => {
    const { container } = setupCard({ imageUrl: IMAGE_URL });

    fireEvent.error(thumbnail(container)!);

    expect(thumbnail(container)).toBeNull();
    expect(placeholderIcon(container)).toBeInTheDocument();
  });

  test("is absent without an imageUrl, leaving the placeholder", () => {
    const { container } = setupCard({ imageUrl: null });

    expect(thumbnail(container)).toBeNull();
    expect(placeholderIcon(container)).toBeInTheDocument();
  });
});
