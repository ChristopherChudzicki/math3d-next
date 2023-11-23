import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import FormDialog from "./components/FormDialog";

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [_isAuthenticated, setIsAuthenticated] = useAuthStatus();

  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const logout = useLogout();
  const handleSubmit: React.FormEventHandler = useCallback(
    async (e) => {
      e.preventDefault();
      logout.mutateAsync();
      setIsAuthenticated(false);
      handleClose();
    },
    [handleClose, logout, setIsAuthenticated],
  );
  return (
    <FormDialog
      title="Logout"
      open
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitButtonContent="Yes, log out"
    >
      Are you sure you want to log out?
    </FormDialog>
  );
};

export default LogoutPage;
