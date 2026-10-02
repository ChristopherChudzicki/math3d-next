import React from "react";
import { render, screen, within } from "@testing-library/react";
import ButtonGroup from "./ButtonGroup";
import Button from "../Button";

test("is a named group that holds buttons and other content", () => {
  render(
    <ButtonGroup aria-label="Speed">
      <Button>Slower</Button>
      <output>1x</output>
      <Button>Faster</Button>
    </ButtonGroup>,
  );

  const group = screen.getByRole("group", { name: "Speed" });
  expect(within(group).getAllByRole("button")).toHaveLength(2);
  expect(within(group).getByRole("status")).toHaveTextContent("1x");
});

test("keeps role=group and merges its className", () => {
  render(
    // @ts-expect-error role is fixed
    <ButtonGroup aria-label="Actions" role="toolbar" className="extra">
      <Button>Go</Button>
    </ButtonGroup>,
  );

  expect(screen.getByRole("group", { name: "Actions" })).toHaveClass("extra");
});
