import { APP_VERSION } from "@/version";

/**
 * Base URL for filing issues. Reuses the app-wide `VITE_ISSUE_URL` (also used by
 * the legacy dialog) so there is a single source of truth, with a hard fallback
 * so the error page never depends on env being present.
 */
const ISSUE_BASE =
  import.meta.env.VITE_ISSUE_URL ??
  "https://github.com/ChristopherChudzicki/math3d-next/issues";

/** Keep the prefilled body well under GitHub's URL length limit. */
const MAX_BODY = 4000;

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
  const base = `${ISSUE_BASE.replace(/\/+$/, "")}/new`;
  try {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const browser = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const errorBlock = [message, stack].filter(Boolean).join("\n\n");
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
    ]
      .join("\n")
      .slice(0, MAX_BODY);
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
