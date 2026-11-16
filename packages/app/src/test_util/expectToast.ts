import { screen, waitFor, within } from "@testing-library/react";
import { shownToasts } from "@/ui/Toast/toasts";

/**
 * Assert a toast or notice shows `text`, and mark it acknowledged for the
 * toast guard in setupTests. Leaves it open, so a test can go on to check what
 * dismisses it. Queries by text in the regions, since each toast is itself a
 * role="dialog".
 */
const expectToast = async (text: string): Promise<void> => {
  await waitFor(() => {
    const regions = screen.getAllByRole("region", {
      name: /^(Notifications|Notices)$/,
    });
    const [match] = regions.flatMap((r) => within(r).queryAllByText(text));
    expect(match).toBeVisible();
  });
  // One toast per message, so a message shown twice is acknowledged once.
  const rest = shownToasts.filter((shown) => shown !== text);
  shownToasts.splice(0, shownToasts.length, ...rest);
};

export default expectToast;
