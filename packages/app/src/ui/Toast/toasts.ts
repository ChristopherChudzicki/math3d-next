import { createToastManager } from ".";

const toastManager = createToastManager();
/** Ids of open toasts by description: one toast per message. */
const open = new Map<string, string>();
/** Every description shown, for the test suite's unacknowledged-toast guard. */
const shownToasts: string[] = [];

const dismissToast = (description: string): void => {
  const id = open.get(description);
  if (id === undefined) return;
  open.delete(description);
  toastManager.close(id);
};

/**
 * Show `description` until the user dismisses it. Repeating a message closes
 * its toast and adds a new one: an `add` reusing the id would update the toast
 * in place without announcing it again.
 */
const showToast = (description: string): void => {
  dismissToast(description);
  const id = toastManager.add({
    description,
    // "high" announces through a sibling of the aria-live viewport, which a
    // later modal hides; "low" keeps the toast inside it, where it stays exposed.
    priority: "low",
    timeout: 0,
    onClose: () => {
      if (open.get(description) === id) open.delete(description);
    },
  });
  open.set(description, id);
  shownToasts.push(description);
};

export { toastManager, showToast, dismissToast, shownToasts };
