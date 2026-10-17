/**
 * Application version information.
 *
 * The version is set at build time via the VITE_APP_VERSION environment variable.
 * It follows the format YYYY.MM.DD.N (e.g., 2025.12.20.1).
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "unknown";
