import { vi } from "vitest";
import type {
  GoogleCredentialResponse,
  GoogleIdentityApi,
} from "@/features/auth/googleIdentity";

/**
 * Install the `window.google.accounts.id` object the gsi/client script would
 * define, so the loader short-circuits and never injects a script.
 *
 * `fireCredential` replays what Google calls after a successful consent popup.
 */
const mockGoogleIdentity = () => {
  let callback: ((response: GoogleCredentialResponse) => void) | null = null;
  const initialize = vi.fn(
    (config: Parameters<GoogleIdentityApi["initialize"]>[0]) => {
      callback = config.callback;
    },
  );
  const renderButton = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton } } };
  return {
    initialize,
    renderButton,
    fireCredential: (credential: string) => {
      if (!callback) {
        throw new Error("google.accounts.id.initialize has not been called.");
      }
      callback({ credential });
    },
  };
};

export { mockGoogleIdentity };
