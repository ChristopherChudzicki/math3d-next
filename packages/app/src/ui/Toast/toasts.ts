import { createToastManager } from "./Toaster";

const toastManager = createToastManager();
/** Ids of open toasts by description: one toast per message. */
const open = new Map<string, string>();
let nextId = 0;
/** Every description shown, for the test suite's unacknowledged-toast guard. */
const shownToasts: string[] = [];

/**
 * Base UI's toast manager drops what it emits before `Toast.Provider`
 * subscribes, in an effect; deferring past the current commit's effects lets a
 * page toast (or dismiss) from its first commit.
 */
const afterEffects = (emit: () => void) => queueMicrotask(emit);

const dismissToast = (description: string): void => {
  const id = open.get(description);
  if (id === undefined) return;
  open.delete(description);
  afterEffects(() => toastManager.close(id));
};

/**
 * Show `description` until the user dismisses it. Repeating a message closes
 * its toast and adds a new one: an `add` reusing the id would update the toast
 * in place without announcing it again.
 */
const showToast = (description: string): void => {
  dismissToast(description);
  const id = `toast-${(nextId += 1)}`;
  open.set(description, id);
  afterEffects(() =>
    toastManager.add({
      id,
      description,
      // "high" announces through a sibling of the aria-live viewport, which a
      // later modal hides; "low" keeps the toast inside it, where it stays
      // exposed.
      priority: "low",
      timeout: 0,
      onClose: () => {
        if (open.get(description) === id) open.delete(description);
      },
    }),
  );
  shownToasts.push(description);
};

export { toastManager, showToast, dismissToast, shownToasts };
