import pRetry from "p-retry";

type EmailMatchers = {
  subject: string | RegExp;
  to: string | RegExp;
  after?: Date;
};

interface EmailData {
  headers: {
    Subject?: string;
    From?: string;
    To?: string;
  };
  date: Date;
  text?: string;
  html?: string;
}

abstract class InboxBackend {
  abstract findEmail(matchers: EmailMatchers): Promise<EmailData>;

  /**
   * Housekeeping only — correctness never depends on an empty inbox, since
   * `EmailMatchers.to` is required and tests use per-run-unique recipients.
   * Deleting only old emails keeps concurrent suite runs (e.g. worktrees)
   * from destroying each other's in-flight messages.
   */
  abstract deleteOlderThan(cutoff: Date): Promise<void>;

  public async waitForEmail(matchers: EmailMatchers): Promise<EmailData> {
    return pRetry(() =>
      this.findEmail({
        ...matchers,
      }),
    );
  }
}

export default InboxBackend;

export type { EmailData, EmailMatchers };
