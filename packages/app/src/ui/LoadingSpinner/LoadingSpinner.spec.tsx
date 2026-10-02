import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

test("is a named progressbar", () => {
  render(<LoadingSpinner label="Loading scenes" />);

  expect(
    screen.getByRole("progressbar", { name: "Loading scenes" }),
  ).toBeInTheDocument();
});
