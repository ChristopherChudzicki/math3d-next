import React from "react";
import { MathItem, MathItemType } from "configs";
import MathItemComponent from "../MathItem";

interface Props {
  folder: MathItem<MathItemType.Folder>;
  items: MathItem[];
}

const FolderWithContents: React.FC<Props> = ({ folder, items }) => {
  return (
    <>
      <MathItemComponent item={folder} />
      <div>
        {items.map((item) => (
          <MathItemComponent key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

export default FolderWithContents;
