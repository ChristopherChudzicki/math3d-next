import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, expect } from "@playwright/test";
import FileEmailBackend, { findEmail } from "./FileInboxBackend";

const writeEmail = async (
  dir: string,
  name: string,
  { to, subject, date }: { to: string; subject: string; date: Date },
) => {
  const raw = [
    "From: noreply@example.com",
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date.toUTCString()}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Body",
    "",
  ].join("\n");
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, raw);
  return filePath;
};

// Pins the branches the e2e auth-flow suites can't hit deterministically: the
// age/`after` cutoffs and the .log filter. The happy path (find an email by
// subject/recipient) is already exercised end-to-end, so it isn't retested here.
test.describe("FileInboxBackend", () => {
  let dir: string;

  test.beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "inbox-"));
  });

  test.afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test("deleteOlderThan deletes .log files older than the cutoff, keeps newer", async () => {
    const cutoff = new Date("2026-07-02T12:00:00Z");
    const oldPath = await writeEmail(dir, "old.log", {
      to: "a@example.com",
      subject: "Old",
      date: cutoff,
    });
    const newPath = await writeEmail(dir, "new.log", {
      to: "a@example.com",
      subject: "New",
      date: cutoff,
    });
    // deleteOlderThan keys on mtime, not the Date header.
    await fs.utimes(oldPath, cutoff, new Date(cutoff.getTime() - 60_000));
    await fs.utimes(newPath, cutoff, new Date(cutoff.getTime() + 60_000));

    await new FileEmailBackend(dir).deleteOlderThan(cutoff);

    await expect(fs.access(oldPath)).rejects.toThrow();
    await expect(fs.access(newPath)).resolves.toBeUndefined();
  });

  test("deleteOlderThan never sweeps non-.log files, even when old", async () => {
    const cutoff = new Date("2026-07-02T12:00:00Z");
    const strayPath = path.join(dir, ".gitkeep");
    await fs.writeFile(strayPath, "not an email");
    await fs.utimes(strayPath, cutoff, new Date(cutoff.getTime() - 60_000));

    // Cutoff far past the stray's mtime: only the .log filter can spare it.
    await new FileEmailBackend(dir).deleteOlderThan(
      new Date(cutoff.getTime() + 60_000),
    );

    await expect(fs.access(strayPath)).resolves.toBeUndefined();
  });

  test("findEmail honors the `after` cutoff", async () => {
    const sentAt = new Date("2026-07-02T12:00:00Z");
    await writeEmail(dir, "msg.log", {
      to: "alice@example.com",
      subject: "Activate your account",
      date: sentAt,
    });
    const matchers = { subject: "Activate", to: "alice@example.com" };

    const found = await findEmail(dir, {
      ...matchers,
      after: new Date(sentAt.getTime() - 1000),
    });
    expect(found.date.getTime()).toBe(sentAt.getTime());

    await expect(
      findEmail(dir, { ...matchers, after: new Date(sentAt.getTime() + 1000) }),
    ).rejects.toThrow(/No email found/);
  });
});
