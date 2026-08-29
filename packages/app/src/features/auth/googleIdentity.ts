const GSI_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export type GoogleCredentialResponse = {
  /** A signed JWT; the backend verifies it against Google's certs. */
  credential: string;
};

export type GoogleIdentityApi = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with";
      width?: number;
    },
  ): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

let loading: Promise<GoogleIdentityApi> | null = null;

/**
 * Resolve Google Identity Services, injecting its script on first use.
 *
 * Loaded on demand rather than from index.html: only the sign-in dialog needs
 * it, so every other visit would otherwise pay for a third-party script.
 */
export const loadGoogleIdentity = (): Promise<GoogleIdentityApi> => {
  const loaded = window.google?.accounts?.id;
  if (loaded) return Promise.resolve(loaded);
  if (loading) return loading;
  loading = new Promise<GoogleIdentityApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    // Both failure paths clear the memo: a content blocker or offline moment
    // can pass by the time the dialog is reopened.
    const fail = (message: string) => {
      loading = null;
      reject(new Error(message));
    };
    script.addEventListener("load", () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else fail(`${GSI_SRC} loaded without defining google.accounts.id`);
    });
    script.addEventListener("error", () => fail(`Could not load ${GSI_SRC}`));
    document.head.appendChild(script);
  });
  return loading;
};
