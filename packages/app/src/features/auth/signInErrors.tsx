import React from "react";
import { ISSUE_URL } from "@/config/issueUrl";
import type { SignInError } from "@/services/auth/signInErrorCodes";
import TextLink from "@/ui/TextLink";

const ContactLink: React.FC<{ children: string }> = ({ children }) => (
  <TextLink href={ISSUE_URL} target="_blank" rel="noreferrer">
    {children}
  </TextLink>
);

const SIGN_IN_ERROR_MESSAGES: Record<SignInError, React.ReactNode> = {
  cancelled: "Sign-in was cancelled.",
  signup_closed: "New sign-ups are closed right now.",
  email_taken: (
    <>
      This email address already belongs to another Math3d account. If it&apos;s
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

export { SIGN_IN_ERROR_MESSAGES };
