import { string } from "yup";

/**
 * allauth's return from a failed sign-in. Any string, so a code the app
 * doesn't know still reaches `toSignInError`.
 */
export const signInErrorSearchFields = {
  error: string(),
  error_process: string(),
};
