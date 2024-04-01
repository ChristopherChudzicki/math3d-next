import React from "react";
import {
  renderHook,
  screen,
  within,
  act,
  waitFor,
  waitForElementToBeRemoved,
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

const assertNotResolvedSoon = async (
  promise: Promise<unknown>,
  { timeout = 20 }: { timeout?: number } = {},
) => {
  const key = Symbol("timeout");
  const timer = new Promise<symbol>((resolve) => {
    setTimeout(() => resolve(key), timeout);
  });
  const resolvedFirst = await Promise.race([promise, timer]);
  expect(resolvedFirst).toBe(key);
};

describe("NotificationsDisplay and useNotifications", () => {
  test("NotificationsDisplay should render alerts and confirmations", async () => {
    const { result } = renderHook(useNotifications, { wrapper: Wrapper });
    act(() => {
      result.current.add({ title: "Alert 1", body: "body 1", type: "alert" });
      result.current.add({
        title: "Confirm 2",
        body: "body 2",
        type: "confirmation",
      });
    });

    const dialog2 = screen.getByRole("dialog");
    expect(dialog2).toHaveTextContent("Confirm 2");
    expect(within(dialog2).getByRole("heading")).toHaveTextContent("Confirm 2");
    const [cancel, confirm, ...others2] =
      within(dialog2).getAllByRole("button");
    expect(cancel).toHaveAccessibleName("Cancel");
    expect(confirm).toHaveAccessibleName("Confirm");
    expect(others2).toHaveLength(0);
    await user.click(confirm);

    await waitFor(() => {
      expect(dialog2).not.toBeInTheDocument();
    });

    const dialog1 = screen.getByRole("dialog");
    expect(dialog1).toHaveTextContent("Alert 1");
    expect(within(dialog1).getByRole("heading")).toHaveTextContent("Alert 1");
    const [ok, ...others1] = within(dialog1).getAllByRole("button");
    expect(ok).toHaveAccessibleName("OK");
    expect(others1).toHaveLength(0);
    await user.click(ok);

    await waitFor(() => {
      expect(dialog1).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test.each([
    { buttonName: "Confirm", expectedConfirmed: true },
    { buttonName: "Cancel", expectedConfirmed: false },
  ])(
    "Confirmations resolve to $expectedConfirmed when clicking $buttonName",
    async ({ buttonName, expectedConfirmed }) => {
      const { result } = renderHook(useNotifications, { wrapper: Wrapper });
      let confirmed: Promise<boolean>;
      act(() => {
        const notification = result.current.add({
          title: "Confirm 1",
          body: "body 1",
          type: "confirmation",
        });
        confirmed = notification.confirmed;
      });

      await act(() => assertNotResolvedSoon(confirmed));

      const dialog = screen.getByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: buttonName }),
      );
      await waitForElementToBeRemoved(dialog);

      expect(await confirmed!).toBe(expectedConfirmed);
    },
  );

  test("Add, remove, throw errors without NotificationsProvider", async () => {
    const { result } = renderHook(useNotifications);
    expect(() =>
      result.current.add({ title: "Title 1", body: "body 1", type: "alert" }),
    ).toThrow();
    expect(() => result.current.remove("id", false)).toThrow();
  });
});
