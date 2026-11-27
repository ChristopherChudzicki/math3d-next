import React, { useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { getCsrfToken } from "@math3d/api";
import Button from "@/ui/Button";
import { useAppStore } from "@/store/hooks";
import { saveSignInDraft } from "@/services/auth/signInDraft";
import { useAuthStatus } from "@/services/auth/useAuthStatus";

const PROVIDER_REDIRECT_URL = `${import.meta.env.VITE_API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`;

type Props = {
  provider: "google" | "dummy";
  children: React.ReactNode;
  className?: string;
};

/**
 * Starts allauth's redirect flow with a top-level form POST: a form can't send
 * the `X-CSRFToken` header the API client uses, so the token rides as a field.
 */
const ProviderSignInButton: React.FC<Props> = ({
  provider,
  children,
  className,
}) => {
  const store = useAppStore();
  const router = useRouter();
  // `/v1/me/` seeds the csrftoken cookie; until it answers, the POST would 403.
  const ready = useAuthStatus() !== "loading";
  const csrfInput = useRef<HTMLInputElement>(null);
  const callbackInput = useRef<HTMLInputElement>(null);

  return (
    <form
      method="post"
      action={PROVIDER_REDIRECT_URL}
      onSubmit={() => {
        // Read at submit: any sign-in, such as one in another tab, rotates it.
        csrfInput.current!.value = getCsrfToken();
        // This page as it stands under the sign-in dialog, overlays included.
        const { publicHref } = router.buildLocation({
          to: ".",
          unsafeRelative: "path",
          search: (prev) => ({ ...prev, signin: undefined }),
          hash: true,
        });
        const callbackUrl = `${window.location.origin}${publicHref}`;
        callbackInput.current!.value = callbackUrl;
        saveSignInDraft(store.getState(), callbackUrl);
      }}
    >
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="process" value="login" />
      <input type="hidden" name="callback_url" ref={callbackInput} />
      <input type="hidden" name="csrfmiddlewaretoken" ref={csrfInput} />
      <Button type="submit" className={className} disabled={!ready}>
        {children}
      </Button>
    </form>
  );
};

export default ProviderSignInButton;
