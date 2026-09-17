import React, { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from "./googleIdentity";

type GoogleSignInButtonProps = {
  /** Called with the ID token Google issues after a successful consent. */
  onCredential: (credential: string) => void;
  /** Called when Google's script never loads, so no button can be drawn. */
  onUnavailable: () => void;
};

/**
 * The Google-rendered sign-in button.
 *
 * Google draws the button itself into `container`, so there is nothing here to
 * style or label; the surrounding dialog owns what happens to the credential.
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  onUnavailable,
}) => {
  const container = useRef<HTMLDivElement>(null);

  // `initialize` and `renderButton` are one-shot imperative calls, so the
  // effect must not re-run when a handler's identity changes; a second
  // renderButton would draw a second button into the same node.
  const handler = useRef(onCredential);
  const unavailableHandler = useRef(onUnavailable);
  useEffect(() => {
    handler.current = onCredential;
    unavailableHandler.current = onUnavailable;
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
        if (!cancelled) unavailableHandler.current();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={container} />;
};

export default GoogleSignInButton;
