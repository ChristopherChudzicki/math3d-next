import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReferencePanel from "./ReferencePanel";
import type { ReferenceEntry } from "./util";

const entry: ReferenceEntry = {
  id: "sin",
  name: "sine",
  latex: "\\sin",
  keyboard: "sin",
  summaryInnerHtml: "The sine function.",
  detailsHtml: "<p>More about sine.</p>",
  tags: ["trig"],
};

// "Show more" and "Show less" are deliberately one persistent element whose
// label toggles, so activating it keeps keyboard focus. This guards against a
// regression if it's ever split back into two elements swapped in/out of the
// DOM, which would drop focus to <body> on each click.
test("the show more/less toggle keeps focus when activated", async () => {
  const user = userEvent.setup();
  render(<ReferencePanel entries={[entry]} />);

  const toggle = screen.getByRole("button", { name: "Show more" });
  await user.click(toggle);
  expect(screen.getByRole("button", { name: "Show less" })).toHaveFocus();

  await user.click(screen.getByRole("button", { name: "Show less" }));
  expect(screen.getByRole("button", { name: "Show more" })).toHaveFocus();
});
