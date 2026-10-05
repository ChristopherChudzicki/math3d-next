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

test("is described by its description, and marked invalid when invalid", () => {
  render(
    <TextField
      label="Confirm"
      description="Type the phrase exactly."
      invalid
    />,
  );

  const input = screen.getByRole("textbox", { name: "Confirm" });
  expect(input).toHaveAccessibleDescription("Type the phrase exactly.");
  expect(input).toBeInvalid();
});
