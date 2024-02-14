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
  protected instantiatedAt = new Date();

  abstract findEmail(matchers: EmailMatchers): Promise<EmailData>;

  public async waitForEmail(matchers: EmailMatchers): Promise<EmailData> {
    return pRetry(() =>
      this.findEmail({
        after: this.instantiatedAt,
        ...matchers,
      }),
    );
  }
}

export default InboxBackend;

export type { EmailData, EmailMatchers };
