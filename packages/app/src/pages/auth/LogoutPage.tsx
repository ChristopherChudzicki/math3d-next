import React, { useCallback, useEffect } from "react";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
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
    <BasicDialog
      title="Sign out"
      open
      onClose={close}
      onConfirm={handleSubmit}
      confirmText="Yes, sign out"
    >
      Are you sure you want to log out?
    </BasicDialog>
  );
};

export default LogoutPage;
