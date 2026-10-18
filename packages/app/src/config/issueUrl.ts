import invariant from "tiny-invariant";

export const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;
invariant(ISSUE_URL, "VITE_ISSUE_URL is not set");
