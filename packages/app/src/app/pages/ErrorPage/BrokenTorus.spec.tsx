import React from "react";
import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@/test_util";
import BrokenTorus from "./BrokenTorus";
import brokenTorusPaths, { DEFAULT_OPTIONS } from "./brokenTorusGeometry";

describe("BrokenTorus", () => {
  test("renders a decorative svg hidden from assistive tech", () => {
    render(<BrokenTorus />);
    const svg = screen.getByTestId("broken-torus");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

describe("brokenTorusPaths geometry", () => {
  test("is deterministic", () => {
    expect(brokenTorusPaths()).toEqual(brokenTorusPaths());
  });

  test("leaves an angular wedge missing from the cross-section rings", () => {
    // far fewer than `rings` full circles are drawn, because the wedge is skipped
    const full = brokenTorusPaths().filter((p) => p.role === "main");
    expect(full.length).toBeLessThan(DEFAULT_OPTIONS.rings);
  });

  test("includes a dashed 'ghost' ring marking the break", () => {
    expect(brokenTorusPaths().some((p) => p.dash)).toBe(true);
  });
});
