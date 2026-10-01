import React, { act } from "react";
import {
  fireEvent,
  renderHook,
  screen,
  within,
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

    const dialog2 = screen.getByRole("alertdialog");
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

    const dialog1 = screen.getByRole("alertdialog");
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
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
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

      const dialog = screen.getByRole("alertdialog");
      await user.click(
        within(dialog).getByRole("button", { name: buttonName }),
      );
      await waitFor(() => expect(dialog).not.toBeInTheDocument());

      expect(await confirmed!).toBe(expectedConfirmed);
    },
  );

  test("Escape dismisses a confirmation as not confirmed", async () => {
    const { result } = renderHook(useNotifications, { wrapper: Wrapper });
    let confirmed: Promise<boolean>;
    act(() => {
      confirmed = result.current.add({
        title: "Confirm 1",
        body: "body 1",
        type: "confirmation",
      }).confirmed;
    });
    const dialog = screen.getByRole("alertdialog", { name: "Confirm 1" });
    // Focus starts on the safe choice.
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Cancel" }),
      ).toHaveFocus(),
    );

    await user.keyboard("{Escape}");

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(await confirmed!).toBe(false);
  });

  test("A confirmation answered just before another arrives keeps its answer", async () => {
    const { result } = renderHook(useNotifications, { wrapper: Wrapper });
    let confirmed: Promise<boolean>;
    act(() => {
      confirmed = result.current.add({
        title: "Confirm 1",
        body: "body 1",
        type: "confirmation",
      }).confirmed;
    });
    const dialog = screen.getByRole("alertdialog", { name: "Confirm 1" });

    // The newer notice must replace the first before the first's exit
    // completes, so the click and the add have to land in one React batch.
    // Don't swap in `await user.click(...)`: user-event flushes updates and
    // timers before it resolves, so the exit has finished by the time the add
    // runs, and the test passes even with the bug present (checked by removing
    // NotificationDialog's unmount report).
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
      result.current.add({ title: "Alert 2", body: "body 2", type: "alert" });
    });

    expect(await confirmed!).toBe(true);
    expect(
      screen.getByRole("alertdialog", { name: "Alert 2" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", { name: "Confirm 1" })).toBeNull();
  });

  test("Add, remove, throw errors without NotificationsProvider", async () => {
    const { result } = renderHook(useNotifications);
    expect(() =>
      result.current.add({ title: "Title 1", body: "body 1", type: "alert" }),
    ).toThrow();
    expect(() => result.current.remove("id", false)).toThrow();
  });
});
