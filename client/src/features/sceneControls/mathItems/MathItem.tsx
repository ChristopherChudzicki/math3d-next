import React from "react";
import type { MathItem } from "types";
import ItemTemplate from "./ItemTemplate";

type Props = {
  item: MathItem;
};
const MathItemComponent: React.FC<Props> = ({ item }) => {
  const { properties } = item;
  return <ItemTemplate />;
};

export default MathItemComponent;
