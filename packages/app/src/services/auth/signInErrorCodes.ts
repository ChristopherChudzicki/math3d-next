// allauth's `?error=` codes: AuthError values, SignupClosedException, and
// CustomSocialAccountAdapter's validation errors.
const SIGN_IN_ERRORS = [
  "cancelled",
  "signup_closed",
  "email_taken",
  "unverified_email",
  "unknown",
] as const;

type SignInError = (typeof SIGN_IN_ERRORS)[number];

const toSignInError = (code: string): SignInError =>
  (SIGN_IN_ERRORS as readonly string[]).includes(code)
    ? (code as SignInError)
    : "unknown";

export { toSignInError };
export type { SignInError };
