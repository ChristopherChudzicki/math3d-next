import { renderTestApp, screen, waitFor, within } from "@/test_util";
import { test, describe, expect } from "vitest";

describe("ScenesListPage", () => {
  test.each([
    {
      initialRoute: "/scenes/examples",
      selectedTab: "Examples",
    },
    {
      initialRoute: "/scenes/me",
      selectedTab: "My Scenes",
    },
  ])(
    "Active tab is determined by route",
    async ({ selectedTab, initialRoute }) => {
      await renderTestApp(initialRoute);
      const tablist = await screen.findByRole("tablist", { name: "Scenes" });
      await within(tablist).findByRole("tab", {
        selected: true,
        name: selectedTab,
      });
    },
  );

  test("Invalid routes route to examples tab", async () => {
    const { location } = await renderTestApp("/scenes/invalid-tabname");
    const tablist = await screen.findByRole("tablist", { name: "Scenes" });
    await within(tablist).findByRole("tab", {
      selected: true,
      name: "Examples",
    });
    await waitFor(() => {
      expect(location.current.pathname).toBe("/scenes/examples");
    });
  });

  test("On the 'My Scenes' tab, unauthenticated users see login prompt", () => {});
});
