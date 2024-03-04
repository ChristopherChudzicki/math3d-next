import { test as setup } from "@/fixtures/users";
import { getInbox } from "./utils/inbox/emails";

const inbox = getInbox();

setup("Clear emails", async () => {
  await inbox.deleteAll();
});
