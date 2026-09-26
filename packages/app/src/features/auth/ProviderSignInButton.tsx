import React from "react";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useLocation } from "react-router";
import type { Location } from "react-router";
import { getCsrfToken } from "@math3d/api";
import { useAppStore } from "@/store/hooks";
import { saveSignInDraft } from "./signInDraft";
import { useAuthStatus } from "./useAuthStatus";

const PROVIDER_REDIRECT_URL = `${import.meta.env.VITE_API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`;

// This page as it stands under the sign-in dialog.
const callbackUrl = ({ pathname, search, hash }: Location): string => {
  const params = new URLSearchParams(search);
  params.delete("overlay");
  const query = params.toString();
  return `${window.location.origin}${pathname}${query ? `?${query}` : ""}${hash}`;
};

type Props = {
  provider: "google" | "dummy";
  children: string;
  variant?: ButtonProps["variant"];
  startIcon?: React.ReactNode;
  className?: string;
};

/**
 * Starts allauth's redirect flow with a top-level form POST: a form can't send
 * the `X-CSRFToken` header the API client uses, so the token rides as a field.
 */
const ProviderSignInButton: React.FC<Props> = ({
  provider,
  children,
  variant = "contained",
  startIcon,
  className,
}) => {
  const store = useAppStore();
  const location = useLocation();
  // `users/me` seeds the csrftoken cookie; until it answers, the POST would 403.
  const ready = useAuthStatus() !== "loading";

  return (
    <form
      method="post"
      action={PROVIDER_REDIRECT_URL}
      aria-label={children}
      onSubmit={() => saveSignInDraft(store.getState(), location.pathname)}
    >
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="process" value="login" />
      <input type="hidden" name="callback_url" value={callbackUrl(location)} />
      <input type="hidden" name="csrfmiddlewaretoken" value={getCsrfToken()} />
      <Button
        type="submit"
        variant={variant}
        startIcon={startIcon}
        className={className}
        disabled={!ready}
      >
        {children}
      </Button>
    </form>
  );
};

export default ProviderSignInButton;
