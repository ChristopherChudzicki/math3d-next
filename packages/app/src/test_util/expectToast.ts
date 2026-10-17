import { screen, waitFor, within } from "@testing-library/react";
import { shownToasts } from "@/features/toasts/toasts";

/**
 * Assert a toast shows `text`, and mark it acknowledged for the toast guard in
 * setupTests. Leaves it open, so a test can go on to check what dismisses it.
 * Queries by text in the region, since each toast is itself a role="dialog".
 */
const expectToast = async (text: string): Promise<void> => {
  const region = await screen.findByRole("region", { name: "Notifications" });
  await waitFor(() => expect(within(region).getByText(text)).toBeVisible());
  // One toast per message, so a message shown twice is acknowledged once.
  const rest = shownToasts.filter((shown) => shown !== text);
  shownToasts.splice(0, shownToasts.length, ...rest);
};

export default expectToast;
