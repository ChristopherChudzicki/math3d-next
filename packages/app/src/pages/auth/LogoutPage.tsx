import React, { useCallback, useEffect } from "react";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import { AlertDialog } from "@/ui/AlertDialog";
import Button from "@/ui/Button";
import { useOverlay } from "@/features/overlays/useOverlay";

const LogoutPage: React.FC = () => {
  const { close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const logout = useLogout();
  const handleSubmit = useCallback(async () => {
    await logout.mutateAsync();
    // mutateAsync awaits onSuccess which resets queries (including
    // useUserMe), so auth status is already up-to-date.
    close();
  }, [close, logout]);
  useEffect(() => {
    // Only redirect if we know the user is NOT authenticated.
    // When auth status is "loading", don't redirect yet.
    if (isAuthenticated === "unauthenticated") {
      close();
    }
  }, [isAuthenticated, close]);
  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <AlertDialog.Popup>
        <AlertDialog.Title>Sign out</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to sign out?
        </AlertDialog.Description>
        <AlertDialog.Actions>
          <AlertDialog.Close render={<Button>Cancel</Button>} />
          <Button
            variant="solid"
            tone="accent"
            loading={logout.isPending}
            onClick={handleSubmit}
          >
            Yes, sign out
          </Button>
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
};

export default LogoutPage;
