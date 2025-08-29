import React from "react";
import BasicDialog from "@/util/components/BasicDialog";
import invariant from "tiny-invariant";
import { Button } from "@mui/material";
import Link from "@/util/components/Link";

const ISSUE_URL = "https://github.com/christopherchudzicki/math3d/issues";
const LEGACY_APP_BASE_URL = import.meta.env.VITE_LEGACY_APP_BASE_URL;
invariant(LEGACY_APP_BASE_URL, "VITE_LEGACY_APP_BASE_URL is not set");

type LegacyDialogProps = {
  sceneKey: string;
};

const LegacyDialog: React.FC<LegacyDialogProps> = ({ sceneKey }) => {
  const [open, setOpen] = React.useState(false);

  const legacyHref = `${LEGACY_APP_BASE_URL}/${sceneKey}`;

  return (
    <>
      <Button
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          zIndex: 5000,
        }}
        variant="text"
        size="small"
        color="warning"
        onClick={() => setOpen(true)}
      >
        Legacy Scene
      </Button>
      <BasicDialog
        title="Legacy Scene"
        open={open}
        fullWidth
        maxWidth="xs"
        cancelButton={null}
        onClose={() => setOpen(false)}
      >
        <p>
          This scene was created with an older version of Math3d. It should load
          correctly. If it does not, please{" "}
          <Link href={ISSUE_URL}>report an issue</Link>.
        </p>

        <p>
          <em>
            The scene can also be viewed on the old site at{" "}
            <Link href={legacyHref} target="_blank">
              {legacyHref}
            </Link>
            .
          </em>
        </p>
      </BasicDialog>
    </>
  );
};

export default LegacyDialog;
export type { LegacyDialogProps };
