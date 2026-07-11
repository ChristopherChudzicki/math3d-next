import React, { act } from "react";
import { renderHook, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { BannersProvider, useBanners } from "./BannerContext";
import BannerDisplay from "./BannerDisplay";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BannersProvider>
    <BannerDisplay />
    {children}
  </BannersProvider>
);

describe("BannerDisplay and useBanners", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("shows a banner's content", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({ id: "a", severity: "warning", content: "Hi" });
    });

    expect(await screen.findByText("Hi")).toBeVisible();
  });

  test("multiple banners are shown stacked", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({ id: "a", severity: "warning", content: "First" });
      result.current.show({ id: "b", severity: "info", content: "Second" });
    });

    expect(await screen.findByText("First")).toBeVisible();
    expect(await screen.findByText("Second")).toBeVisible();
  });

  test("calling show() again with an id already present is a no-op", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({ id: "a", severity: "warning", content: "First" });
      result.current.show({ id: "a", severity: "warning", content: "Second" });
    });

    expect(await screen.findByText("First")).toBeVisible();
    expect(screen.queryByText("Second")).not.toBeInTheDocument();
  });

  test("dismissing without remembering removes the banner without persisting", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({
        id: "a",
        severity: "warning",
        content: "Hi",
        persistKey: "test-dismissed",
      });
    });
    await screen.findByText("Hi");

    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));

    expect(screen.queryByText("Hi")).not.toBeInTheDocument();
    expect(localStorage.getItem("test-dismissed")).not.toBe("true");
  });

  test("dismissing without confirmedContent and remember checked persists and closes immediately", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({
        id: "a",
        severity: "warning",
        content: "Hi",
        persistKey: "test-dismissed",
      });
    });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));

    expect(screen.queryByText("Hi")).not.toBeInTheDocument();
    expect(localStorage.getItem("test-dismissed")).toBe("true");
  });

  test("dismissing with remember checked shows confirmedContent, persists, then auto-closes", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({
        id: "a",
        severity: "warning",
        content: "Hi",
        persistKey: "test-dismissed",
        confirmedContent: "Bye",
        confirmationDurationMs: 300,
      });
    });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));

    expect(localStorage.getItem("test-dismissed")).toBe("true");
    expect(await screen.findByText("Bye")).toBeVisible();

    await waitFor(() => {
      expect(screen.queryByText("Bye")).not.toBeInTheDocument();
    });
  });

  test("clicking dismiss again during confirmation closes immediately", async () => {
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({
        id: "a",
        severity: "warning",
        content: "Hi",
        persistKey: "test-dismissed",
        confirmedContent: "Bye",
      });
    });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));
    await screen.findByText("Bye");

    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));

    expect(screen.queryByText("Bye")).not.toBeInTheDocument();
  });

  test("show() does not display a banner whose persistKey is already dismissed", async () => {
    localStorage.setItem("test-dismissed", "true");
    const { result } = renderHook(useBanners, { wrapper: Wrapper });
    act(() => {
      result.current.show({
        id: "a",
        severity: "warning",
        content: "Hi",
        persistKey: "test-dismissed",
      });
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(screen.queryByText("Hi")).not.toBeInTheDocument();
  });

  test("show and dismiss throw errors without BannersProvider", () => {
    const { result } = renderHook(useBanners);
    expect(() =>
      result.current.show({ id: "a", severity: "warning", content: "Hi" }),
    ).toThrow();
    expect(() => result.current.dismiss("a")).toThrow();
  });
});
