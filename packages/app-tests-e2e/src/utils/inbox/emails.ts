import path from "node:path";
import env from "@/env";
import FileEmailBackend from "./FileInboxBackend";
import type InboxBackend from "./InboxBackend";

const getEmailBackend = (): InboxBackend => {
  if (env.EMAIL_BACKEND === "FileEmailBackend") {
    return new FileEmailBackend(path.join(env.PROJECT_CWD, env.EMAIL_DIR));
  }
  throw new Error("Unknown email backend");
};

export { getEmailBackend };
