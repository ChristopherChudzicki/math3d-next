import React from "react";
import Typography from "@mui/material/Typography";
import AppPageLayout from "@/pages/AppPageLayout/AppPageLayout";

const NotFoundPage: React.FC = () => (
  <AppPageLayout
    title={
      <Typography component="h1" variant="h5">
        Page not found
      </Typography>
    }
  >
    <Typography>That page doesn&apos;t exist.</Typography>
  </AppPageLayout>
);

export default NotFoundPage;
