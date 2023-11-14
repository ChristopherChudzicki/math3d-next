import React from "react";
import user from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import ColorPicker from "./ColorPicker";

const colorsWithStyles = [
  {
    value: "red",
    backgroundPreview: "red",
    label: "Red",
  },
  {
    value: "blue",
    backgroundPreview: "blue",
    label: "Blue",
  },
];

describe("ColorPicker", () => {
  it("renders a button for each color", () => {
    render(<ColorPicker colors={colorsWithStyles} value="red" />);
    expect(screen.getByRole("button", { name: "Red" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Blue" })).toBeVisible();
  });

  it("Clicking a color swatch calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <ColorPicker onChange={onChange} colors={colorsWithStyles} value="red" />,
    );

    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Red" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ value: "red" });
  });

  test("Entering a valid color in custom color calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <ColorPicker onChange={onChange} colors={colorsWithStyles} value="red" />,
    );
    const textInput = screen.getByRole("textbox", { name: "Custom Color" });

    expect(onChange).not.toHaveBeenCalled();
    await user.clear(textInput);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(textInput);
    await user.paste("green");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ value: "green" });
    await user.clear(textInput);
    await user.paste("#abc123");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith({ value: "#abc123" });
  });

  test("Entering an invalid color in custom color does not call onChange", async () => {
    const onChange = vi.fn();
    render(
      <ColorPicker onChange={onChange} colors={colorsWithStyles} value="red" />,
    );
    const textInput = screen.getByRole("textbox", { name: "Custom Color" });

    expect(onChange).not.toHaveBeenCalled();
    await user.clear(textInput);
    await user.click(textInput);
    // empty is invalid
    expect(onChange).not.toHaveBeenCalled();
    await user.paste("not-a-color");
    expect(onChange).not.toHaveBeenCalled();

    // missing '#'
    await user.clear(textInput);
    await user.paste("abc123");
    expect(onChange).not.toHaveBeenCalled();
    await user.clear(textInput);

    // This one is valid:
    await user.clear(textInput);
    await user.paste("#abc123");
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.clear(textInput);
  });
});
