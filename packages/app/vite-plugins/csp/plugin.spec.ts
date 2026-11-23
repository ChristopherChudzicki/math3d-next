import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { csp, headersRule, parseHeadersRule, securityHeaders } from "./plugin";

const directive = (policy: string, name: string) =>
  policy
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("securityHeaders", () => {
  const sentryDsn = "https://abc123@o42.ingest.us.sentry.io/7";

  test("connect-src allows the API and Sentry ingest origins", () => {
    const headers = securityHeaders({
      apiBaseUrl: "https://api.math3d.org/some/path",
      sentryDsn,
    });
    expect(
      directive(headers["Content-Security-Policy"], "connect-src"),
    ).toEqual([
      "'self'",
      "https://api.math3d.org",
      "https://o42.ingest.us.sentry.io",
    ]);
  });

  test("reports violations to Sentry's security endpoint", () => {
    const headers = securityHeaders({
      apiBaseUrl: "https://api.math3d.org",
      sentryDsn,
      release: "1.2.3",
    });
    const endpoint =
      "https://o42.ingest.us.sentry.io/api/7/security/?sentry_key=abc123&sentry_environment=production&sentry_release=1.2.3";
    expect(directive(headers["Content-Security-Policy"], "report-uri")).toEqual(
      [endpoint],
    );
    expect(directive(headers["Content-Security-Policy"], "report-to")).toEqual([
      "csp-endpoint",
    ]);
    expect(headers["Reporting-Endpoints"]).toBe(`csp-endpoint="${endpoint}"`);
  });

  test("without a Sentry DSN, allows only the API and reports nowhere", () => {
    const headers = securityHeaders({
      apiBaseUrl: "http://api.math3d.localhost:8000",
    });
    const policy = headers["Content-Security-Policy"];
    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "http://api.math3d.localhost:8000",
    ]);
    expect(directive(policy, "report-uri")).toBeUndefined();
    expect(headers["Reporting-Endpoints"]).toBeUndefined();
  });
});

test("parseHeadersRule reads back the rule among others in _headers", () => {
  const headers = securityHeaders({
    apiBaseUrl: "https://api.math3d.org",
    sentryDsn: "https://abc123@o42.ingest.us.sentry.io/7",
  });
  const file = [
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    headersRule(headers),
    "",
    "/other",
    "  X-Other: 1",
  ].join("\n");
  expect(parseHeadersRule(file)).toEqual(headers);
});

test("the build appends the rule after the rules public/_headers supplies", () => {
  const outDir = mkdtempSync(path.join(tmpdir(), "csp-"));
  onTestFinished(() => rmSync(outDir, { recursive: true }));
  const headersFile = path.join(outDir, "_headers");
  const copied =
    "/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n";
  writeFileSync(headersFile, copied);
  const env = { VITE_API_BASE_URL: "https://api.math3d.org" };
  const plugin = csp();
  const call = (hook: unknown, ...args: unknown[]) =>
    (hook as (...a: unknown[]) => void)(...args);
  call(plugin.configResolved, { root: outDir, build: { outDir: "." }, env });
  call(plugin.writeBundle);
  const file = readFileSync(headersFile, "utf8");
  expect(file.startsWith(copied)).toBe(true);
  expect(parseHeadersRule(file)).toEqual(
    securityHeaders({ apiBaseUrl: env.VITE_API_BASE_URL }),
  );
});
