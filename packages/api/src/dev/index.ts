/**
 * Helpers for signing in as an arbitrary local account through allauth's dummy
 * provider, which exists only on a backend running with `IS_DEPLOYMENT=False`.
 *
 * Off the package's main entry so that importing forged credentials into
 * production code is a deliberate act rather than an autocomplete away.
 */
export { dummyIdentity, dummyIdToken } from "./dummyIdentity";
export type { DummyIdentity } from "./dummyIdentity";
