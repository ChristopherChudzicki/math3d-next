import { contentSecurityPolicy } from "./plugin";

const directive = (policy: string, name: string) =>
  policy
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("contentSecurityPolicy", () => {
  test("connect-src allows the API and Sentry ingest origins", () => {
    const policy = contentSecurityPolicy({
      apiBaseUrl: "https://api.math3d.org/some/path",
      sentryDsn: "https://abc123@o42.ingest.us.sentry.io/7",
    });
    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "https://api.math3d.org",
      "https://o42.ingest.us.sentry.io",
    ]);
  });

  test("without a Sentry DSN, connect-src allows only the API", () => {
    const policy = contentSecurityPolicy({
      apiBaseUrl: "http://api.math3d.localhost:8000",
    });
    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "http://api.math3d.localhost:8000",
    ]);
  });
});
