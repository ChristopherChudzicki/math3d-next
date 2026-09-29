import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import Button from "./Button";

test("does not submit an enclosing form unless asked to", async () => {
  const onSubmit = vi.fn((e: React.SyntheticEvent) => e.preventDefault());
  render(
    <form onSubmit={onSubmit}>
      <Button>Plain</Button>
      <Button type="submit">Submit</Button>
    </form>,
  );

  await user.click(screen.getByRole("button", { name: "Plain" }));
  expect(onSubmit).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Submit" }));
  expect(onSubmit).toHaveBeenCalledOnce();
});

test("a loading button keeps focus, reports busy, and ignores clicks", async () => {
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Save</Button>);
  const button = screen.getByRole("button", { name: "Save" });
  button.focus();

  rerender(
    <Button onClick={onClick} loading>
      Save
    </Button>,
  );
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).toHaveAttribute("aria-busy", "true");

  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});
