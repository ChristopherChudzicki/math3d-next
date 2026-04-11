import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const logout = useLogout();
  const handleSubmit = useCallback(async () => {
    await logout.mutateAsync();
    // mutateAsync awaits onSuccess which resets queries (including
    // useUserMe), so auth status is already up-to-date.
    handleClose();
  }, [handleClose, logout]);
  useEffect(() => {
    // Only redirect if we know the user is NOT authenticated.
    // When auth status is "loading", don't redirect yet.
    if (isAuthenticated === "unauthenticated") {
      navigate("../");
    }
  }, [isAuthenticated, navigate]);
  return (
    <BasicDialog
      title="Sign out"
      open
      onClose={handleClose}
      onConfirm={handleSubmit}
      confirmText="Yes, sign out"
    >
      Are you sure you want to log out?
    </BasicDialog>
  );
};

export default LogoutPage;
