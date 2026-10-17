/**
 * All user-facing copy and external URLs for the fallback error page, in one
 * place so wording can be iterated without touching component logic.
 */
const errorPageCopy = {
  eyebrow: "Application error",
  title: "We hit a discontinuity.",
  body: "Math3d ran into an unexpected error and couldn't finish rendering. Reloading might clear it — if not, report the problem below and we'll take a look.",
  reload: "Reload page",
  home: "Back to home",
  detailsSummary: "Technical details",
  copy: "Copy details",
  copied: "Copied",
  report: "Report this bug",
  /** Generic fallback when a thrown value carries no usable message. */
  unknownError: "An unexpected error occurred.",
  homeHref: "/",
} as const;

export default errorPageCopy;
