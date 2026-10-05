import React from "react";
import { HeaderTitle } from "@/ui/Header";
import AppPageLayout from "@/pages/AppPageLayout/AppPageLayout";

const NotFoundPage: React.FC = () => (
  <AppPageLayout title={<HeaderTitle>Page not found</HeaderTitle>}>
    <p>That page doesn&apos;t exist.</p>
  </AppPageLayout>
);

export default NotFoundPage;
