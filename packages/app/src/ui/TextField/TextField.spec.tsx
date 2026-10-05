import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import TextField from "./TextField";

test("is a textbox named by its label, and reports typing", async () => {
  const onChange = vi.fn();
  render(<TextField label="Filter scenes" onChange={onChange} />);

  await user.type(screen.getByRole("textbox", { name: "Filter scenes" }), "a");

  expect(onChange).toHaveBeenCalledOnce();
});

test("is described by its description", () => {
  render(<TextField label="Confirm" description="Type the phrase exactly." />);

  expect(
    screen.getByRole("textbox", { name: "Confirm" }),
  ).toHaveAccessibleDescription("Type the phrase exactly.");
});

test("is marked invalid only when invalid", () => {
  const { rerender } = render(<TextField label="Confirm" />);
  expect(screen.getByRole("textbox", { name: "Confirm" })).toBeValid();

  rerender(<TextField label="Confirm" invalid />);
  expect(screen.getByRole("textbox", { name: "Confirm" })).toBeInvalid();
});

test("keeps the start adornment out of the input's name", () => {
  render(<TextField label="Custom Color" startAdornment="Swatch" />);

  expect(screen.getByText("Swatch")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveAccessibleName("Custom Color");
});
