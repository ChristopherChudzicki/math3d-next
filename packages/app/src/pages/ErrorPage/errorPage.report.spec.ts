import { describe, test, expect } from "vitest";
import buildReportUrl from "./errorPage.report";

describe("buildReportUrl", () => {
  test("builds a prefilled new-issue URL from the error", () => {
    const href = buildReportUrl({
      message: "Boom",
      stack: "at foo (x.js:1:2)",
    });
    const url = new URL(href);
    expect(url.pathname).toMatch(/\/issues\/new$/);
    expect(url.searchParams.get("title")).toContain("Boom");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Boom");
    expect(body).toContain("at foo (x.js:1:2)");
  });

  test("caps the prefilled body so a huge stack can't blow up the URL", () => {
    const href = buildReportUrl({ message: "Boom", stack: "x".repeat(50_000) });
    const body = new URL(href).searchParams.get("body") ?? "";
    expect(body.length).toBeLessThanOrEqual(4000);
  });
});
