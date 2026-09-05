import React, { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from "./googleIdentity";

type GoogleSignInButtonProps = {
  /** Called with the ID token Google issues after a successful consent. */
  onCredential: (credential: string) => void;
};

/**
 * The Google-rendered sign-in button.
 *
 * Google draws the button itself into `container`, so there is nothing here to
 * style or label; the surrounding dialog owns what happens to the credential.
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  // `initialize` and `renderButton` are one-shot imperative calls, so the
  // effect must not re-run when the handler's identity changes; a second
  // renderButton would draw a second button into the same node.
  const handler = useRef(onCredential);
  useEffect(() => {
    handler.current = onCredential;
  });

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !container.current) return;
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => handler.current(credential),
        });
        google.renderButton(container.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (unavailable) {
    return (
      <Alert severity="error">
        Could not load Google sign-in. A content blocker or network problem may
        be stopping it — allow accounts.google.com, then reload.
      </Alert>
    );
  }
  return <div ref={container} />;
};

export default GoogleSignInButton;
