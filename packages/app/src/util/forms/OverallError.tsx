import React from "react";
import Alert from "@mui/material/Alert";

type OverallErrorProps = {
  error?: {
    message?: string;
  };
};

/**
 * Display an overall error message for a form.
 */
const OverallError: React.FC<OverallErrorProps> = ({ error }) => {
  if (error?.message === undefined) return null;
  return <Alert severity="error">{error.message}</Alert>;
};

export default OverallError;
