import Button from "@mui/material/Button";
import React from "react";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useAppSelector } from "@/store/hooks";
import { useCreateScene } from "@/api/scene";
import { select } from "./mathItemsSlice";

const ShareButton: React.FC = () => {
  const scene = useAppSelector(select.scene());
  const createScene = useCreateScene();
  const handleClick = async () => {
    await createScene.mutateAsync(scene);
  };
  return (
    <Button
      variant="text"
      color="secondary"
      onClick={handleClick}
      disabled={createScene.isLoading}
      startIcon={<CloudOutlinedIcon fontSize="inherit" />}
    >
      Share
    </Button>
  );
};

export default ShareButton;
