import React, { useCallback, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {
  dummyIdentity,
  dummyIdToken,
  isApiError,
  useProviderTokenLogin,
} from "@math3d/api";
import styles from "./DummySignInForm.module.css";

const DEFAULT_EMAIL = "dev@example.com";
const STORAGE_KEY = "math3d:dummy-auth-emails";
const MAX_REMEMBERED = 8;

// allauth resolves an app by client_id only for providers with `uses_apps`;
// the dummy provider has none, so this value is accepted and never read.
const IGNORED_CLIENT_ID = "dummy";

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
 * arguments, so exercising this exercises the real sign-in path. The address
 * is the whole identity — see `dummyIdentity` for why it also derives the uid
 * — so any address names an account and the same address always returns to it.
 */
const DummySignInForm: React.FC = () => {
  const [remembered, setRemembered] = useState(readRemembered);
  const [email, setEmail] = useState(() => remembered[0] ?? DEFAULT_EMAIL);
  const login = useProviderTokenLogin();
  const [failed, setFailed] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const address = email.trim();
      if (!address) return;
      setFailed(false);
      try {
        await login.mutateAsync({
          provider: "dummy",
          client_id: IGNORED_CLIENT_ID,
          id_token: dummyIdToken(dummyIdentity(address)),
        });
        setRemembered(remember(address));
      } catch {
        setFailed(true);
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
          />
        )}
      />
      <Button type="submit" variant="outlined" disabled={login.isPending}>
        Sign in as dev user
      </Button>
      {failed && (
        <Alert severity="error">
          {isApiError(login.error, [403])
            ? "Sign-ups are closed on this backend, so a new address cannot be used."
            : "Dev sign-in failed. Is the backend running with IS_DEPLOYMENT=False?"}
        </Alert>
      )}
    </form>
  );
};

export default DummySignInForm;
