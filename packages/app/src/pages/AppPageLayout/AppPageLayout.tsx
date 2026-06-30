import React from "react";
import Container from "@mui/material/Container";
import Header from "@/util/components/Header";
import Link from "@/util/components/Link";

const AppPageLayout: React.FC<{
  title?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <>
    <Header title={title} nav={<Link href="/">Back to Math3d</Link>} />
    <Container>{children}</Container>
  </>
);

export default AppPageLayout;
