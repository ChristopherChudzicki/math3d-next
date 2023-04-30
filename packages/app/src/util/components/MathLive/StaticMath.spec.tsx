/* eslint-disable testing-library/no-node-access */
import React from "react";
import { render } from "@testing-library/react";
import { test, expect } from "vitest";
import { renderMathInElement } from "mathlive";
import StaticMath from "./StaticMath";

test.each([
  { mode: "inline", expectedType: "math/tex; mode=text" },
  { mode: "display", expectedType: "math/tex" },
] as const)(
  "StaticMath renders a span with script type $expectedType when mode is $mode",
  ({ mode, expectedType }) => {
    const { container } = render(<StaticMath value="x^2" mode={mode} />);
    expect(container.innerHTML).toBe(
      `<span><script type="${expectedType}">x^2</script></span>`
    );
  }
);

test("renderMathInElement is called when value changes", () => {
  const { rerender, container } = render(
    <StaticMath value="x^2" mode="inline" />
  );
  const span = container.firstChild as HTMLElement;
  expect(renderMathInElement).toHaveBeenCalledTimes(1);
  expect(renderMathInElement).toHaveBeenCalledWith(span);
  rerender(<StaticMath value="x^3" mode="inline" />);
  expect(renderMathInElement).toHaveBeenCalledTimes(2);
});

test("renderMathInElement is called when mode changes", () => {
  const { rerender, container } = render(
    <StaticMath value="x^2" mode="inline" />
  );
  const span = container.firstChild as HTMLElement;
  expect(renderMathInElement).toHaveBeenCalledTimes(1);
  expect(renderMathInElement).toHaveBeenCalledWith(span);
  rerender(<StaticMath value="x^2" mode="display" />);
  expect(renderMathInElement).toHaveBeenCalledTimes(2);
});

test("renderMathInElement is NOT called on re-render unncessarily", () => {
  const { rerender, container } = render(
    <StaticMath value="x^2" mode="inline" />
  );
  const span = container.firstChild as HTMLElement;
  expect(renderMathInElement).toHaveBeenCalledTimes(1);
  expect(renderMathInElement).toHaveBeenCalledWith(span);
  rerender(<StaticMath value="x^2" mode="inline" />);
  rerender(<StaticMath value="x^2" mode="inline" className="foo" />);
  expect(renderMathInElement).toHaveBeenCalledTimes(1);
});
