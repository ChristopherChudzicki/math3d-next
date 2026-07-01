import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReferencePanel from "./ReferencePanel";
import type { ReferenceEntry } from "./util";

const makeEntry = (
  overrides: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id: "sin",
  name: "sine",
  latex: "\\sin",
  keyboard: "sin",
  summaryInnerHtml: "The sine function.",
  detailsHtml: "<p>More about sine.</p>",
  tags: ["trig"],
  ...overrides,
});

describe("ReferencePanel show more/less focus", () => {
  test("focus moves to the Show less button after expanding", async () => {
    const user = userEvent.setup();
    render(<ReferencePanel entries={[makeEntry()]} />);

    await user.click(screen.getByRole("button", { name: "Show more" }));

    expect(screen.getByRole("button", { name: "Show less" })).toHaveFocus();
  });

  test("focus moves to the Show more button after collapsing", async () => {
    const user = userEvent.setup();
    render(<ReferencePanel entries={[makeEntry()]} />);

    await user.click(screen.getByRole("button", { name: "Show more" }));
    await user.click(screen.getByRole("button", { name: "Show less" }));

    expect(screen.getByRole("button", { name: "Show more" })).toHaveFocus();
  });
});
