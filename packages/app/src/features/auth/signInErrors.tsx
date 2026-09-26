import React from "react";
import Link from "@mui/material/Link";

type SignInError =
  | "cancelled"
  | "signup_closed"
  | "email_taken"
  | "unverified_email"
  | "unknown";

// Where allauth sends an error it can't return to callback_url
// (HEADLESS_FRONTEND_URLS on the backend).
const SIGN_IN_ERROR_PATH = "/app/sign-in-error";

const ContactLink: React.FC<{ children: string }> = ({ children }) => (
  <Link href={import.meta.env.VITE_ISSUE_URL} target="_blank" rel="noreferrer">
    {children}
  </Link>
);

// allauth's `?error=` codes: AuthError values, SignupClosedException, and
// CustomSocialAccountAdapter's validation errors.
const SIGN_IN_ERROR_MESSAGES: Record<SignInError, React.ReactNode> = {
  cancelled: "Sign-in was cancelled.",
  signup_closed: "New sign-ups are closed right now.",
  email_taken: (
    <>
      This email address already belongs to another math3d account. If it&apos;s
      yours, <ContactLink>get in touch</ContactLink>.
    </>
  ),
  unverified_email:
    "Google didn't confirm this email address, so no account can be created.",
  unknown: (
    <>
      Sign-in didn&apos;t complete. Please try again, and{" "}
      <ContactLink>get in touch</ContactLink> if it keeps happening.
    </>
  ),
};

const toSignInError = (code: string): SignInError =>
  Object.hasOwn(SIGN_IN_ERROR_MESSAGES, code)
    ? (code as SignInError)
    : "unknown";

export { SIGN_IN_ERROR_MESSAGES, SIGN_IN_ERROR_PATH, toSignInError };
export type { SignInError };
