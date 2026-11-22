import type { Plugin } from "vite";

type PolicyOrigins = {
  apiBaseUrl: string;
  sentryDsn?: string;
};

/**
 * The app's Content-Security-Policy. A `<meta>` policy can't set
 * `frame-ancestors`, so any site may embed the app; the session cookie is
 * SameSite=Lax, so a cross-site embed is always signed out.
 */
export const contentSecurityPolicy = ({
  apiBaseUrl,
  sentryDsn,
}: PolicyOrigins): string => {
  const connect = ["'self'", new URL(apiBaseUrl).origin];
  if (sentryDsn) connect.push(new URL(sentryDsn).origin);
  return [
    "default-src 'self'",
    // Cloudflare Web Analytics injects its beacon script at the edge; the
    // beacon reports to the same origin.
    "script-src 'self' https://static.cloudflareinsights.com 'report-sample'",
    // MathLive writes `<style>` elements and inline `style` attributes.
    "style-src 'self' 'unsafe-inline'",
    // Scene thumbnails come from the screenshots Worker, whose origin the
    // backend knows and this build does not.
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    // No `form-action`: browsers apply it to each redirect after sign-in's POST,
    // a chain through Google's pages that we don't control.
  ].join("; ");
};

/**
 * Puts the policy in the built `index.html` as a `<meta>` tag. Build only: the
 * dev server runs inline scripts (React Fast Refresh).
 */
export const csp = (): Plugin => {
  let policy = "";
  return {
    name: "math3d:csp",
    apply: "build",
    configResolved(config) {
      policy = contentSecurityPolicy({
        apiBaseUrl: config.env.VITE_API_BASE_URL,
        sentryDsn: config.env.VITE_SENTRY_DSN,
      });
    },
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: policy },
        injectTo: "head-prepend",
      },
    ],
  };
};
