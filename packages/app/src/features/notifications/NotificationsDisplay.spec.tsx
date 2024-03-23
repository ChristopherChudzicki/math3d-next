import React from "react";
import {
  renderHook,
  screen,
  within,
  act,
  waitFor,
} from "@testing-library/react";
import user from "@testing-library/user-event";
import {
  NotificationsProvider,
  useNotifications,
} from "./NotificationsContext";
import NotificationsDisplay from "./NotificationsDisplay";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationsProvider>
    <NotificationsDisplay />
    {children}
  </NotificationsProvider>
);

describe("NotificationsDisplay and useNotifications", () => {
  test("NotificationsDisplay should render notifications", async () => {
    const { result } = renderHook(useNotifications, { wrapper: Wrapper });
    act(() => {
      result.current.add({ title: "Title 1", body: "body 1" });
      result.current.add({ title: "Title 2", body: "body 2" });
    });

    const dialog2 = screen.getByRole("dialog");
    expect(dialog2).toHaveTextContent("Title 2");
    expect(within(dialog2).getByRole("heading")).toHaveTextContent("Title 2");
    await user.click(within(dialog2).getByRole("button", { name: /OK/i }));
    await waitFor(() => {
      expect(dialog2).not.toBeInTheDocument();
    });

    const dialog1 = screen.getByRole("dialog");
    expect(dialog1).toHaveTextContent("Title 1");
    expect(within(dialog1).getByRole("heading")).toHaveTextContent("Title 1");
    await user.click(within(dialog1).getByRole("button", { name: /OK/i }));
    await waitFor(() => {
      expect(dialog1).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("Add, remove, throw errors without NotificationsProvider", () => {
    const { result } = renderHook(useNotifications);
    expect(() =>
      result.current.add({ title: "Title 1", body: "body 1" }),
    ).toThrow();
    expect(() => result.current.remove("id")).toThrow();
  });
});
