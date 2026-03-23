import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useAuthStatus();
  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const logout = useLogout();
  const handleSubmit = useCallback(async () => {
    await logout.mutateAsync();
    setIsAuthenticated(false);
    handleClose();
  }, [handleClose, logout, setIsAuthenticated]);
  useEffect(() => {
    // Only redirect if we know the user is NOT authenticated (false).
    // When auth status is null (loading), don't redirect yet.
    if (isAuthenticated === false) {
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
