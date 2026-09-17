import React, { useCallback, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { ApiError, useProviderTokenLogin } from "@math3d/api";
import { dummyIdentity, dummyIdToken } from "@math3d/api/dev";
import styles from "./DummySignInForm.module.css";

const DEFAULT_EMAIL = "dev@example.com";
const STORAGE_KEY = "math3d:dummy-auth-emails";
const MAX_REMEMBERED = 8;

// allauth resolves an app by client_id only for providers with `uses_apps`.
// The dummy provider has none, so the field is required by the schema and never
// read. Sending a placeholder beats relaxing the schema, which would drop the
// requirement from the Google path, where a mismatch is the whole failure mode.
const UNREAD_CLIENT_ID = "irrelevant";

const readRemembered = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    // Private windows and blocked site data throw on access, and a half-written
    // value fails to parse; neither is worth failing sign-in over.
    return [];
  }
};

const remember = (email: string): string[] => {
  const next = [email, ...readRemembered().filter((e) => e !== email)].slice(
    0,
    MAX_REMEMBERED,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Nothing here needs to persist for sign-in to work.
  }
  return next;
};

/**
 * Sign in as an arbitrary local account, for development and the e2e suite.
 *
 * Sends the same mutation as the Google button, differing only in its
 * arguments, so exercising this exercises the real sign-in path. The address is
 * the whole identity — see `dummyIdentity` for why it also derives the uid — so
 * an address returns to the same account on every use of this control.
 */
const DummySignInForm: React.FC = () => {
  const [remembered, setRemembered] = useState(readRemembered);
  const [email, setEmail] = useState(() => remembered[0] ?? DEFAULT_EMAIL);
  const login = useProviderTokenLogin();
  const [failure, setFailure] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const address = email.trim();
      if (!address) return;
      setFailure(null);
      try {
        await login.mutateAsync({
          provider: "dummy",
          client_id: UNREAD_CLIENT_ID,
          id_token: dummyIdToken(dummyIdentity(address)),
        });
        setRemembered(remember(address));
      } catch (err) {
        // The raw body, not a classification of it. Every failure here is a
        // local-setup problem read by whoever caused it, and allauth's own
        // error codes say more than any copy we could map them to.
        setFailure(
          err instanceof ApiError
            ? `${err.status} ${JSON.stringify(err.data)}`
            : String(err),
        );
      }
    },
    [email, login],
  );

  return (
    <form className={styles["dummy-sign-in"]} onSubmit={handleSubmit}>
      <Autocomplete
        freeSolo
        options={remembered}
        value={email}
        onChange={(_event, value) => setEmail(value ?? "")}
        inputValue={email}
        onInputChange={(_event, value) => setEmail(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Dev sign-in email"
            size="small"
            type="email"
            required
          />
        )}
      />
      <Button type="submit" variant="outlined" disabled={login.isPending}>
        Sign in as dev user
      </Button>
      {failure && (
        <Alert severity="error">
          <code className={styles["dummy-error"]}>{failure}</code>
        </Alert>
      )}
    </form>
  );
};

export default DummySignInForm;
