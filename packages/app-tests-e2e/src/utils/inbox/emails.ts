import path from "node:path";
import env from "@/env";
import FileEmailBackend from "./FileInboxBackend";
import type InboxBackend from "./InboxBackend";

const getInbox = (): InboxBackend => {
  if (env.EMAIL_BACKEND === "FileEmailBackend") {
    return new FileEmailBackend(path.resolve(env.PROJECT_CWD, env.EMAIL_DIR));
  }
  throw new Error("Unknown email backend");
};

/**
 * Cutoff for `EmailMatchers.after`, scoping a lookup to emails this test
 * sent. Call it BEFORE the action that triggers the email, so the cutoff
 * cannot postdate the email. The back-buffer absorbs the Date header's
 * second resolution and clock skew between this host and the docker VM that
 * stamps it. A larger buffer is safe: recipients are unique per test
 * attempt, so no earlier email can slip inside the window.
 */
const emailCutoff = () => new Date(Date.now() - 30_000);

export { getInbox, emailCutoff };
