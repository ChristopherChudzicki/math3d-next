import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Header from "@/util/components/Header";
import Link from "@/util/components/Link";

const NotFoundPage: React.FC = () => (
  <>
    <Header
      title={
        <Typography component="h1" variant="h5">
          Page not found
        </Typography>
      }
      nav={<Link href="/">Back to Math3d</Link>}
    />
    <Container>
      <Typography>
        That page doesn&apos;t exist. <Link href="/">Back to Math3d</Link>.
      </Typography>
    </Container>
  </>
);

export default NotFoundPage;
