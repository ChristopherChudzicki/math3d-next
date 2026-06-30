import { APP_VERSION } from "@/version";

/**
 * Hard fallback so the error page never depends on env being present. The live
 * base comes from `VITE_ISSUE_URL` (also used by the legacy dialog) so there is a
 * single source of truth; its value already points at the issues page (e.g.
 * `…/math3d-next/issues`), and we append `/new` to reach the new-issue form.
 */
const ISSUE_BASE_FALLBACK =
  "https://github.com/ChristopherChudzicki/math3d-next/issues";

/**
 * Cap the trace itself (not the assembled body) so the diagnostic footer
 * (page/version/browser) and the closing code fence always survive truncation —
 * that footer is the context the prefill exists to capture. Counted in raw
 * chars; URL-encoding inflates the final query, so the budget is deliberately
 * conservative to stay well under GitHub's new-issue URL limit (~8 KB).
 */
const MAX_TRACE = 2500;

interface ReportInput {
  message?: string;
  stack?: string;
}

/**
 * Build a GitHub "new issue" URL prefilled with the error and some context, so
 * a non-technical reporter can file a useful bug in one click. Defensive: link
 * construction must never throw — this renders on the app's last line of defense.
 */
const buildReportUrl = ({ message = "", stack }: ReportInput): string => {
  // Read env at call time (not module load) so tests can stub it deterministically.
  const issueBase = import.meta.env.VITE_ISSUE_URL ?? ISSUE_BASE_FALLBACK;
  const base = `${issueBase.replace(/\/+$/, "")}/new`;
  try {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const browser = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const rawError = [message, stack].filter(Boolean).join("\n\n");
    const errorBlock =
      rawError.length > MAX_TRACE
        ? `${rawError.slice(0, MAX_TRACE)}\n…(trace truncated)`
        : rawError;
    const body = [
      "**What were you doing when this happened?**",
      "",
      "",
      "---",
      "_Auto-filled details:_",
      "",
      "```",
      errorBlock,
      "```",
      "",
      `- Page: ${pageUrl}`,
      `- Version: ${APP_VERSION}`,
      `- Browser: ${browser}`,
    ].join("\n");
    const title = `Unexpected error: ${message.split("\n")[0]}`
      .trim()
      .slice(0, 120);
    const params = new URLSearchParams({ title, body });
    return `${base}?${params.toString()}`;
  } catch {
    // Never let report-link construction break the error page.
    return base;
  }
};

export default buildReportUrl;
