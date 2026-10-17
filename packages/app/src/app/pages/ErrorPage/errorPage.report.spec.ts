import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import buildReportUrl from "./errorPage.report";

// Pin the issue base so the test is hermetic: CI injects an environment-specific
// VITE_ISSUE_URL (e.g. a localhost placeholder), which we don't want to assert on.
const ISSUE_URL = "https://github.com/ChristopherChudzicki/math3d-next/issues/";

describe("buildReportUrl", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ISSUE_URL", ISSUE_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("builds a prefilled new-issue URL from the error", () => {
    const href = buildReportUrl({
      message: "Boom",
      stack: "at foo (x.js:1:2)",
    });
    const url = new URL(href);
    // `/new` is appended to VITE_ISSUE_URL (trailing slash trimmed).
    expect(url.pathname).toMatch(/\/issues\/new$/);
    expect(url.searchParams.get("title")).toContain("Boom");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Boom");
    expect(body).toContain("at foo (x.js:1:2)");
  });

  test("truncates a huge stack but keeps the diagnostic footer intact", () => {
    const href = buildReportUrl({ message: "Boom", stack: "x".repeat(50_000) });
    const body = new URL(href).searchParams.get("body") ?? "";
    expect(body.length).toBeLessThanOrEqual(4000);
    expect(body).toContain("(trace truncated)");
    // The footer is the context the prefill exists to capture; it must survive
    // truncation, and the code fence around the trace must stay closed.
    expect(body).toContain("- Version:");
    expect(body).toContain("- Browser:");
    expect(body).toMatch(/```[\s\S]*```/);
  });
});
