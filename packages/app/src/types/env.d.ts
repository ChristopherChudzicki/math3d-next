/**
 * The variables vite.config.ts's `ValidateEnv` schema guarantees, so that
 * reading one is `string` rather than vite/client's `any` and a typo does not
 * type-check. Optional here means optional there.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_LEGACY_APP_BASE_URL: string;
  readonly VITE_ISSUE_URL: string;
  readonly VITE_SITE_ORIGIN: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DISPLAY_AUTH_FLOWS?: string;
  readonly VITE_SENTRY_DSN?: string;
}
