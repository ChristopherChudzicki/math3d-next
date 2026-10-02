import React, { useRef } from "react";
import { useLocation } from "react-router";
import type { Location } from "react-router";
import { getCsrfToken } from "@math3d/api";
import Button from "@/ui/Button";
import { useAppStore } from "@/store/hooks";
import { SIGN_IN_PARAM } from "@/features/overlays/useSignInDialog";
import { saveSignInDraft } from "./signInDraft";
import { useAuthStatus } from "./useAuthStatus";

const PROVIDER_REDIRECT_URL = `${import.meta.env.VITE_API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`;

// This page as it stands under the sign-in dialog, overlays included.
const callbackUrl = ({ pathname, search, hash }: Location): string => {
  const params = new URLSearchParams(search);
  params.delete(SIGN_IN_PARAM);
  const query = params.toString();
  return `${window.location.origin}${pathname}${query ? `?${query}` : ""}${hash}`;
};

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
  const location = useLocation();
  // `users/me` seeds the csrftoken cookie; until it answers, the POST would 403.
  const ready = useAuthStatus() !== "loading";
  const csrfInput = useRef<HTMLInputElement>(null);

  return (
    <form
      method="post"
      action={PROVIDER_REDIRECT_URL}
      onSubmit={() => {
        // Read at submit: any sign-in, such as one in another tab, rotates it.
        csrfInput.current!.value = getCsrfToken();
        saveSignInDraft(store.getState(), callbackUrl(location));
      }}
    >
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="process" value="login" />
      <input type="hidden" name="callback_url" value={callbackUrl(location)} />
      <input type="hidden" name="csrfmiddlewaretoken" ref={csrfInput} />
      <Button type="submit" className={className} disabled={!ready}>
        {children}
      </Button>
    </form>
  );
};

export default ProviderSignInButton;
