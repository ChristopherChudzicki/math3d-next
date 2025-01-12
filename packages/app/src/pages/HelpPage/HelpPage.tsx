import React from "react";

import Container from "@mui/material/Container";
import Header from "@/util/components/Header";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid2";
import ReferencePanel from "./ReferencePanel";
import { entries } from "./data.compile";
import { groupEntries } from "./util";
import * as styles from "./HelpPage.module.css";

const HelpPage: React.FC = () => {
  const groups = groupEntries(entries);
  return (
    <>
      <Header
        title={<Typography variant="h6">Function Reference</Typography>}
        nav={<Link href="/">Back to main page</Link>}
      />
      <Container>
        <Grid container>
          <Grid
            className={styles.sidebar}
            component="nav"
            sx={{
              position: "sticky",
              top: "1rem",
              marginTop: "1rem",
              maxHeight: "calc(100vh - 50px)",
            }}
            size={{ xs: 12, sm: 3 }}
          >
            <ul>
              {groups.map((group) => (
                <li key={group.tag}>
                  <Link href={`#${group.tag}`}>{group.label}</Link>
                </li>
              ))}
            </ul>
          </Grid>
          <Grid size={{ xs: 12, sm: 9 }}>
            <ReferencePanel entries={entries} />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default HelpPage;
