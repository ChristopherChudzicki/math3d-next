import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import { BasicDialog } from "./components/BasicDialog";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useAuthStatus();
  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const logout = useLogout();
  const handleSubmit = useCallback(async () => {
    logout.mutateAsync();
    setIsAuthenticated(false);
    handleClose();
  }, [handleClose, logout, setIsAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) {
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
