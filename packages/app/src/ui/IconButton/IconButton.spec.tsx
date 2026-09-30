import React from "react";
import { render, screen } from "@testing-library/react";
import IconButton from "./IconButton";

test("is named by its label", () => {
  render(
    <IconButton label="Close">
      <svg aria-hidden="true" />
    </IconButton>,
  );

  expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
});
