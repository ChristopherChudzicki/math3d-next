import { screen, waitFor, within } from "@testing-library/react";
import { shownToasts } from "@/features/toasts";

/**
 * Assert a toast shows `text`, and mark it acknowledged for the toast guard in
 * setupTests. Leaves it open, so a test can go on to check what dismisses it.
 * Queries by text in the region, since each toast is itself a role="dialog".
 */
const expectToast = async (text: string): Promise<void> => {
  const region = await screen.findByRole("region", { name: "Notifications" });
  await waitFor(() => expect(within(region).getByText(text)).toBeVisible());
  const i = shownToasts.indexOf(text);
  if (i !== -1) shownToasts.splice(i, 1);
};

export default expectToast;
