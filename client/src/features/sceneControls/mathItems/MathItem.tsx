import React from "react";
import type { MathItem } from "types";
import ItemTemplate from "./ItemTemplate";

type Props = {
  item: MathItem;
};
const MathItemComponent: React.FC<Props> = ({ item }) => {
  const description = `Description: ${item.id}`;
  return <ItemTemplate description={description} />;
};

export default MathItemComponent;
