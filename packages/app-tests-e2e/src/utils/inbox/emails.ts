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
 * cannot postdate the email. The 2s back-buffer covers the Date header's
 * second resolution: a bare "now" could exclude an email sent within the
 * same second.
 */
const emailCutoff = () => new Date(Date.now() - 2000);

export { getInbox, emailCutoff };
