import fs from "node:fs/promises";
import path from "node:path";
import { readEml } from "./eml-parse-js";
import type { EmailAddress, ReadedEmlJson } from "./eml-parse-js";
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
    .sort((a, b) => b.time - a.time)
    .map((file) => path.join(dir, file.name));
};

const match = (text: string, matcher: string | RegExp) => {
  if (matcher instanceof RegExp) {
    return matcher.test(text);
  }
  return text.includes(matcher);
};

const standardizeTo = (to: ReadedEmlJson["to"]): EmailAddress[] => {
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
    const parsed = readEml(content.toString());
    const recipients = standardizeTo(parsed.to);
    const date = new Date(parsed.date);
    if (
      match(parsed.subject, subject) &&
      recipients.some(({ email }) => match(email, to)) &&
      (!after || date > after)
    ) {
      return {
        headers: parsed.headers,
        html: parsed.html,
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
