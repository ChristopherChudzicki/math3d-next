import { expect, test } from "vitest";
import { renderTestApp, screen, user, within } from "@/test_util";

test("Add Object offers every addable type, in order", async () => {
  renderTestApp("/");
  await user.click(await screen.findByRole("button", { name: "Add Object" }));
  const menu = await screen.findByRole("menu", { name: "Add Object" });
  expect(
    within(menu)
      .getAllByRole("menuitem")
      .map((el) => el.textContent),
  ).toEqual([
    "Point",
    "Line",
    "Vector",
    "Parametric Curve",
    "Parametric Surface",
    "Explicit Surface",
    "Explicit Surface (Polar)",
    "Implicit Surface",
    "Vector Field",
    "Variable or Function",
    "Variable Slider",
    "Toggle Switch",
    "Folder",
  ]);
});
