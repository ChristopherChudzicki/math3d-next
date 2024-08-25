import fs from "node:fs/promises";
import path from "node:path";
import { simpleParser } from "mailparser";
import type { AddressObject } from "mailparser";
import invariant from "tiny-invariant";
import InboxBackend from "./InboxBackend";
import type { EmailData, EmailMatchers } from "./InboxBackend";
/**
 * Returns a list of files in a directory sorted (descending) by their
 * modification time.
 */
const getSortedFiles = async (dir: string) => {
  const files = await fs.readdir(dir);

  const times = await Promise.all(
    files.map(async (fileName) => {
      const stats = await fs.stat(`${dir}/${fileName}`);
      return {
        name: fileName,
        time: stats.mtime.getTime(),
      };
    }),
  );
  return times
    .filter((file) => file.name !== ".gitkeep")
    .sort((a, b) => b.time - a.time)
    .map((file) => path.join(dir, file.name));
};

const match = (text: string, matcher: string | RegExp) => {
  if (matcher instanceof RegExp) {
    return matcher.test(text);
  }
  return text.includes(matcher);
};

const standardizeTo = (
  to: AddressObject | AddressObject[],
): AddressObject[] => {
  if (Array.isArray(to)) return to;
  if (to) return [to];
  return [];
};

/**
 * Find an email in the email directory that matches the given criteria.
 *
 * The chronologically most recent email is returned. If no match is found, an
 * error is thrown.
 */
export const findEmail = async (
  emailDir: string,
  { subject, to, after }: EmailMatchers,
): Promise<EmailData> => {
  const files = await getSortedFiles(emailDir);
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const content = await fs.readFile(file);
    // eslint-disable-next-line no-await-in-loop
    const parsed = await simpleParser(content.toString());
    invariant(parsed.to, "Email must have a 'to' field");
    invariant(parsed.date, "Email must have a 'date' field");
    invariant(parsed.subject, "Email must have a 'date' field");
    const recipients = standardizeTo(parsed.to).flatMap(({ value }) => value);
    const date = new Date(parsed.date);
    if (
      match(parsed.subject, subject) &&
      recipients.some(({ address }) => match(address ?? "", to)) &&
      (!after || date > after)
    ) {
      return {
        headers: {
          Subject: parsed.headers.get("subject") as string,
          From: parsed.headers.get("from") as string,
          To: parsed.headers.get("to") as string,
        },
        html: parsed.html || undefined,
        text: parsed.text,
        date,
      };
    }
  }
  throw new Error(`No email found with subject "${subject}" and to "${to}"`);
};

class FileEmailBackend extends InboxBackend {
  constructor(private emailDir: string) {
    super();
  }

  async findEmail(matchers: EmailMatchers) {
    return findEmail(this.emailDir, matchers);
  }

  async deleteAll() {
    const files = await getSortedFiles(this.emailDir);
    await Promise.all(files.map((file) => fs.unlink(file)));
  }
}

export default FileEmailBackend;
