/**
 * Opt into vite's strict `import.meta.env`. Without it, `ImportMetaEnv` extends
 * `Record<string, any>` (`vite/types/importMeta.d.ts`), so every variable below
 * would be a comment rather than a constraint and a typo would type-check.
 */
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

/**
 * The variables vite.config.ts's `ValidateEnv` schema guarantees. Keep the two
 * lists in step: the schema failing the build on a missing variable is the only
 * thing that makes a non-optional type here true at runtime.
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
  readonly VITE_USE_MSW?: string;
}
