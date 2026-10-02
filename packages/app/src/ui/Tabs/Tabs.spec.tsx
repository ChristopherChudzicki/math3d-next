import React from "react";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { Tabs } from ".";

const Letters: React.FC<{
  value: string;
  onValueChange: Tabs.RootProps["onValueChange"];
}> = ({ value, onValueChange }) => (
  <Tabs.Root value={value} onValueChange={onValueChange}>
    <Tabs.List aria-label="Letters">
      <Tabs.Tab value="a">A</Tabs.Tab>
      <Tabs.Tab value="b">B</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="a">Panel A</Tabs.Panel>
    <Tabs.Panel value="b">Panel B</Tabs.Panel>
  </Tabs.Root>
);

test("the controlled value picks the selected tab and its panel", () => {
  render(<Letters value="b" onValueChange={vi.fn()} />);

  expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("tabpanel", { name: "B" })).toHaveTextContent(
    "Panel B",
  );
  expect(screen.queryByText("Panel A")).not.toBeInTheDocument();
});

test("arrow keys move focus without activating; Enter activates", async () => {
  const onValueChange = vi.fn();
  render(<Letters value="a" onValueChange={onValueChange} />);

  await user.click(screen.getByRole("tab", { name: "A" }));
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "B" })).toHaveFocus();
  expect(onValueChange).not.toHaveBeenCalled();

  await user.keyboard("{Enter}");
  expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
});
