import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";

test.each([
  {
    url: "/?controls=1",
    controlsVisible: true,
  },
  {
    url: "/",
    controlsVisible: true,
  },
  {
    url: "/?controls=0",
    controlsVisible: false,
  },
])(
  "'controls' URL query parameter controls whether the controls are visible",
  async ({ controlsVisible, url }) => {
    await renderTestApp(url);
    const expandBtn = screen.queryByRole("button", { name: "Expand Controls" });
    const collapseBtn = screen.queryByRole("button", {
      name: "Collapse Controls",
    });

    expect(!!expandBtn).toBe(!controlsVisible);
    expect(!!collapseBtn).toBe(controlsVisible);
  }
);

test("Clicking the 'Expand/Collapse Controls' button toggles the controls and preserves hash", async () => {
  const { location } = await renderTestApp("#examples");
  const btn = screen.getByRole("button", { name: "Collapse Controls" });
  expect(location.current).toMatchObject({
    hash: "#examples",
    search: "",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "#examples",
    search: "?controls=0",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "#examples",
    search: "",
  });
});

test.each([
  {
    url: "/#examples",
    examplesVisible: true,
  },
  {
    url: "/",
    examplesVisible: false,
  },
])(
  "URL fragment #examples controls whether the examples are visible",
  async ({ examplesVisible, url }) => {
    await renderTestApp(url);
    const expandBtn = screen.queryByRole("button", { name: "Expand Examples" });
    const collapseBtn = screen.queryByRole("button", {
      name: "Collapse Examples",
    });

    expect(!!expandBtn).toBe(!examplesVisible);
    expect(!!collapseBtn).toBe(examplesVisible);
  }
);

test("Clicking the 'Expand/Collapse Examples' button toggles the controls and preserves search", async () => {
  const { location } = await renderTestApp("?controls=0");
  const btn = screen.getByRole("button", { name: "Expand Examples" });
  expect(location.current).toMatchObject({
    hash: "",
    search: "?controls=0",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "#examples",
    search: "?controls=0",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "",
    search: "?controls=0",
  });
});
