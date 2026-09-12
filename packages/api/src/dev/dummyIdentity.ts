/**
 * The identity allauth's dummy provider derives an account from.
 *
 * The account is keyed on `uid`, not the address — allauth's `DummyProvider`
 * calls `str(data["id"])` — while `SOCIALACCOUNT_EMAIL_AUTHENTICATION` is off,
 * so a fresh uid carrying an address that already has an account is rejected
 * outright (401). Deriving both from the address makes an address name the same
 * account on every sign-in through this helper.
 *
 * Accounts whose uid came from anywhere else still collide: `seed_test_data`
 * gives the static test user uid 2, which no address hashes to, so signing in
 * as that address through this helper is a 401.
 */
type DummyIdentity = {
  email: string;
  uid: string;
};

/** Enough to spread a handful of local addresses across uid space. */
const MODULUS = 2147483647;
const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % MODULUS;
  }
  return h;
};

const dummyIdentity = (email: string): DummyIdentity => ({
  email,
  uid: String(hash(email.trim().toLowerCase())),
});

/**
 * The unsigned JSON payload allauth's dummy provider accepts in place of a
 * signed ID token. `email_verified` mirrors Google, the only real provider.
 */
const dummyIdToken = (identity: DummyIdentity): string =>
  JSON.stringify({
    id: identity.uid,
    email: identity.email,
    email_verified: true,
  });

export { dummyIdentity, dummyIdToken };
export type { DummyIdentity };
