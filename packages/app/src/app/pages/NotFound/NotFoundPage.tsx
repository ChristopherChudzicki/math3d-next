import React from "react";
import { HeaderTitle } from "@/ui/Header";
import ButtonLink from "@/ui/ButtonLink";
import { homeLink } from "@/services/navigation/links";
import AppPageLayout from "@/app/pages/AppPageLayout/AppPageLayout";
import styles from "./NotFoundPage.module.css";

const NotFoundPage: React.FC = () => (
  <AppPageLayout title={<HeaderTitle>Page not found</HeaderTitle>}>
    <p className={styles.message}>That page doesn&apos;t exist.</p>
    <ButtonLink
      {...homeLink}
      variant="solid"
      tone="primary"
      className={styles.home}
    >
      Back to Math3d
    </ButtonLink>
  </AppPageLayout>
);

export default NotFoundPage;
