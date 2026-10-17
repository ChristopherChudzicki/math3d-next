import React, { useEffect } from "react";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/services/auth/useAuthStatus";
import { AlertDialog } from "@/ui/AlertDialog";
import Alert from "@/ui/Alert";
import Button from "@/ui/Button";
import { useOverlay } from "@/services/overlays/useOverlay";
import type { OverlayProps } from "@/services/overlays/useOverlay";

type LogoutContentProps = { close: () => void; children?: React.ReactNode };

const LogoutContent: React.FC<LogoutContentProps> = ({ close, children }) => {
  const isAuthenticated = useAuthStatus();
  // A failure shows in this dialog, which stays open for a retry.
  const logout = useLogout({ meta: { errorToast: false } });
  const handleSubmit = () => {
    // Runs after the hook's onSuccess, which resets queries (including
    // useUserMe), so auth status is already up-to-date.
    logout.mutate(undefined, { onSuccess: close });
  };
  useEffect(() => {
    // Only redirect if we know the user is NOT authenticated.
    // When auth status is "loading", don't redirect yet.
    if (isAuthenticated === "unauthenticated") {
      close();
    }
  }, [isAuthenticated, close]);
  return (
    <>
      <AlertDialog.Title>Sign out</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to sign out?
      </AlertDialog.Description>
      {logout.isError ? (
        <Alert severity="error">Couldn’t sign out. Try again.</Alert>
      ) : null}
      <AlertDialog.Actions>
        <AlertDialog.Close render={<Button>Cancel</Button>} />
        <Button
          variant="solid"
          tone="primary"
          loading={logout.isPending}
          onClick={handleSubmit}
        >
          Yes, sign out
        </Button>
      </AlertDialog.Actions>
      {children}
    </>
  );
};

const LogoutPage: React.FC<OverlayProps> = ({ open, children }) => {
  const { close } = useOverlay();
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <AlertDialog.Popup>
        <LogoutContent close={close}>{children}</LogoutContent>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
};

export default LogoutPage;
