import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LazyViewport from "./LazyViewport";

vi.mock("./Viewport", () => {
  throw new Error("chunk failed to load");
});

test("a MathBox chunk that fails to load marks the scene failed and offers the default renderer", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <MemoryRouter>
      <LazyViewport />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("button", {
      name: "Switch to the default renderer",
    }),
  ).toBeVisible();
  expect(screen.getByTestId("scene")).toHaveAttribute(
    "data-scene-error",
    "error",
  );
});
